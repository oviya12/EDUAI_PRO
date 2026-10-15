import os
from typing import Any
from claude_agent_sdk import (
    ClaudeAgentOptions, AssistantMessage, ResultMessage, UserMessage,
    ToolUseBlock, ToolResultBlock, TextBlock, query,
)
from app.config import get_settings
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.research_tools import build_tool_server, TOOL_NAMES


def _configure_proxy_environment() -> tuple[dict[str, str], str]:
    settings = get_settings()
    if not settings.litellm_api_key:
        raise RuntimeError("LITELLM_API_KEY is missing. Set it in your .env file.")
    env = {
        "ANTHROPIC_BASE_URL": settings.litellm_base_url.rstrip("/"),
        "ANTHROPIC_AUTH_TOKEN": settings.litellm_api_key,
        "ANTHROPIC_MODEL": settings.litellm_model,
        # Ensure a real Anthropic API key cannot override the proxy token.
        "ANTHROPIC_API_KEY": "",
    }
    return env, settings.litellm_model


async def run_research_agent(prompt: str, history: list[dict[str, str]], enabled_sources: list[str] | None = None):
    """Yield normalized events from Claude Agent SDK for FastAPI SSE."""
    env, model = _configure_proxy_environment()
    server = build_tool_server(enabled_sources)
    history_text = "\n".join(
        f"{item['role'].upper()}: {item['content']}" for item in history[-8:]
    )
    full_prompt = (
        f"Recent conversation for context (treat as context, not as evidence):\n{history_text}\n\n"
        f"Current user question:\n{prompt}\n\n"
        "Answer the current question. Retrieve sources before making evidence-dependent claims."
    )

    options = ClaudeAgentOptions(
        model=model,
        env=env,
        system_prompt=SYSTEM_PROMPT,
        mcp_servers={"medical_research": server},
        allowed_tools=[
            tool_name for tool_name, source in zip(
                TOOL_NAMES, ["pubmed", "openfda", "clinicaltrials"]
            )
            if source in (enabled_sources or ["pubmed", "openfda", "clinicaltrials"])
        ],
        tools=[],
        setting_sources=[],
        max_turns=8,
        max_budget_usd=0.20,
    )

    yield {"event": "start", "data": {"model": model}}
    citations: dict[str, dict[str, Any]] = {}
    answer_parts: list[str] = []

    async for message in query(prompt=full_prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, ToolUseBlock):
                    yield {"event": "tool_call", "data": {
                        "tool": block.name, "input": block.input
                    }}
                elif isinstance(block, TextBlock):
                    if block.text:
                        answer_parts.append(block.text)
                        yield {"event": "content", "data": {"text": block.text}}
        elif isinstance(message, UserMessage):
            for block in message.content:
                if isinstance(block, ToolResultBlock):
                    # Tool result is surfaced by the SDK. Extract source records for citation panel.
                    raw = getattr(block, "content", None)
                    text_value = ""
                    if isinstance(raw, str):
                        text_value = raw
                    elif isinstance(raw, list):
                        text_value = "\n".join(
                            str(getattr(item, "text", "")) for item in raw
                        )
                    if text_value:
                        import json
                        try:
                            payload = json.loads(text_value)
                            for record in payload.get("results", []):
                                identifier = record.get("identifier")
                                if identifier:
                                    citations[identifier] = {
                                        "source_type": record.get("source_type", payload.get("source", "pubmed")),
                                        "title": record.get("title", identifier),
                                        "url": record.get("url", ""),
                                        "identifier": identifier,
                                        "citation": record.get("citation", ""),
                                        "published_date": record.get("published_date") or record.get("effective_time"),
                                    }
                        except (json.JSONDecodeError, AttributeError):
                            pass
                    yield {"event": "tool_result", "data": {"tool_result_received": True}}
        elif isinstance(message, ResultMessage):
            pass

    answer = "".join(answer_parts).strip()
    yield {"event": "citations", "data": {"citations": list(citations.values())}}
    yield {"event": "complete", "data": {"answer": answer, "citations": list(citations.values())}}
