import json
from typing import Any

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
    create_sdk_mcp_server,
    tool,
)

from app.config import get_settings
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.research_tools import TOOL_SCHEMAS, execute_tool


DEFAULT_SOURCES = {"pubmed", "openfda", "clinicaltrials"}

JSON_TO_PYTHON = {
    "string": str,
    "integer": int,
    "number": float,
    "boolean": bool,
    "object": dict,
    "array": list,
}


def _source_for_tool(name: str) -> str:
    return {
        "search_pubmed": "pubmed",
        "search_openfda_label": "openfda",
        "search_clinical_trials": "clinicaltrials",
    }.get(name, "unknown")


def _collect_citations(
    records: list[dict[str, Any]],
    citations: dict[str, dict[str, Any]],
) -> None:
    for record in records:
        identifier = record.get("identifier")
        url = record.get("url")

        if not identifier or not url:
            continue

        citations[identifier] = {
            "source_type": record.get(
                "source_type", "pubmed"
            ),
            "title": record.get("title", identifier),
            "url": url,
            "identifier": identifier,
            "citation": record.get("citation", ""),
            "published_date": (
                record.get("published_date")
                or record.get("effective_time")
            ),
        }


def _make_tool_functions(enabled_sources: set[str]):
    sdk_tools = []
    tool_names = []

    for definition in TOOL_SCHEMAS:
        name = definition["name"]
        source = _source_for_tool(name)

        if source not in enabled_sources:
            continue

        input_schema = definition.get(
            "input_schema", {}
        )
        properties = input_schema.get("properties", {})

        # The SDK tool decorator uses Python types for
        # the tool's input schema.
        sdk_schema = {
            field: JSON_TO_PYTHON.get(
                spec.get("type", "string"), str
            )
            for field, spec in properties.items()
        }

        description = definition.get(
            "description", f"Search {source}"
        )

        async def run_tool(
            args: dict[str, Any],
            _name: str = name,
        ) -> dict[str, Any]:
            try:
                records = await execute_tool(
                    _name, dict(args)
                )
                payload = {
                    "source": _source_for_tool(_name),
                    "results": records,
                }
            except Exception as exc:
                payload = {
                    "error": (
                        f"Tool failed: {type(exc).__name__}"
                    ),
                    "results": [],
                }

            return {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(
                            payload, ensure_ascii=False
                        ),
                    }
                ]
            }

        run_tool.__name__ = f"run_{name}"

        sdk_tool = tool(
            name,
            description,
            sdk_schema,
        )(run_tool)

        sdk_tools.append(sdk_tool)
        tool_names.append(name)

    return sdk_tools, tool_names


def _extract_tool_result(block: ToolResultBlock) -> str:
    raw = getattr(block, "content", None)

    if isinstance(raw, str):
        return raw

    if isinstance(raw, list):
        return "\n".join(
            item.text
            for item in raw
            if isinstance(item, TextBlock)
        )

    return ""


async def run_research_agent(
    prompt: str,
    history: list[dict[str, str]],
    enabled_sources: list[str] | None = None,
):
    settings = get_settings()

    if not settings.litellm_api_key:
        raise RuntimeError(
            "LITELLM_API_KEY is missing."
        )

    enabled = set(enabled_sources or DEFAULT_SOURCES)
    enabled &= DEFAULT_SOURCES

    if not enabled:
        raise ValueError(
            "Enable at least one research source."
        )

    sdk_tools, tool_names = _make_tool_functions(enabled)

    server = create_sdk_mcp_server(
        name="medical_research",
        version="1.0.0",
        tools=sdk_tools,
    )

    env = {
        "ANTHROPIC_BASE_URL": (
            settings.litellm_base_url.rstrip("/")
        ),
        "ANTHROPIC_AUTH_TOKEN": settings.litellm_api_key,
        "ANTHROPIC_MODEL": settings.litellm_model,
        "ANTHROPIC_API_KEY": "",
    }

    history_text = "\n".join(
        f"{item['role'].upper()}: {item['content']}"
        for item in history[-8:]
        if item.get("role") in {"user", "assistant"}
        and item.get("content")
    )

    full_prompt = (
        "You are a medical research assistant. "
        "Use enabled research tools for evidence-based claims. "
        "Never invent citations. Ask for clarification "
        "when a medical query is ambiguous.\n\n"
        f"Enabled sources: {', '.join(sorted(enabled))}\n\n"
        f"Recent conversation:\n{history_text}\n\n"
        f"Current question:\n{prompt}"
    )

    options = ClaudeAgentOptions(
        model=settings.litellm_model,
        env=env,
        system_prompt=SYSTEM_PROMPT,
        mcp_servers={"medical_research": server},
        allowed_tools=[
            f"mcp__medical_research__{name}"
            for name in tool_names
        ],
        tools=[],
        setting_sources=[],
        max_turns=8,
    )

    citations: dict[str, dict[str, Any]] = {}
    answer_parts: list[str] = []

    yield {
        "event": "start",
        "data": {"model": settings.litellm_model},
    }

    async with ClaudeSDKClient(options=options) as client:
        await client.query(full_prompt)

        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, ToolUseBlock):
                        yield {
                            "event": "tool_call",
                            "data": {
                                "tool": block.name,
                                "input": block.input,
                            },
                        }

                    elif isinstance(block, TextBlock):
                        if block.text:
                            answer_parts.append(block.text)
                            yield {
                                "event": "content",
                                "data": {"text": block.text},
                            }

            elif isinstance(message, UserMessage):
                for block in message.content:
                    if not isinstance(block, ToolResultBlock):
                        continue

                    raw = _extract_tool_result(block)

                    try:
                        payload = json.loads(raw)
                        records = payload.get("results", [])
                        source = payload.get("source", "unknown")

                        if isinstance(records, list):
                            _collect_citations(records, citations)

                        yield {
                            "event": "tool_result",
                            "data": {
                                "source": source,
                                "result_count": len(records),
                            },
                        }
                    except (json.JSONDecodeError, AttributeError):
                        yield {
                            "event": "tool_result",
                            "data": {
                                "tool_result_received": True
                            },
                        }

            elif isinstance(message, ResultMessage):
                if getattr(message, "is_error", False):
                    raise RuntimeError(
                        "The agent returned an error."
                    )

    answer = "\n".join(
        part.strip()
        for part in answer_parts
        if part.strip()
    ).strip()

    citation_list = list(citations.values())

    yield {
        "event": "citations",
        "data": {"citations": citation_list},
    }

    yield {
        "event": "complete",
        "data": {
            "answer": answer,
            "citations": citation_list,
        },
    }
