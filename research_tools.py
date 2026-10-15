import json
from typing import Any
from claude_agent_sdk import tool
from app.config import get_settings
from app.services.pubmed import search_pubmed
from app.services.openfda import search_openfda
from app.services.clinicaltrials import search_clinical_trials


def _as_tool_result(payload: dict[str, Any]) -> dict[str, Any]:
    return {"content": [{"type": "text", "text": json.dumps(payload, ensure_ascii=False)}]}


@tool("search_pubmed", "Search PubMed biomedical literature. Use for peer-reviewed studies, reviews, clinical evidence and PMID citations.", {"query": str, "limit": int})
async def pubmed_tool(args: dict[str, Any]) -> dict[str, Any]:
    try:
        results = await search_pubmed(args["query"], args.get("limit", 5))
        return _as_tool_result({"source": "pubmed", "query": args["query"], "results": results})
    except Exception as exc:
        return _as_tool_result({"source": "pubmed", "error": f"PubMed request failed: {type(exc).__name__}", "results": []})


@tool("search_openfda_label", "Search official openFDA drug labels for indications, boxed warnings, contraindications, dosage label text and adverse reactions. Not a personalized dosing recommendation.", {"drug_name": str, "limit": int})
async def openfda_tool(args: dict[str, Any]) -> dict[str, Any]:
    try:
        results = await search_openfda(args["drug_name"], args.get("limit", 3))
        return _as_tool_result({"source": "openfda", "drug_name": args["drug_name"], "results": results})
    except Exception as exc:
        return _as_tool_result({"source": "openfda", "error": f"openFDA request failed: {type(exc).__name__}", "results": []})


@tool("search_clinical_trials", "Search ClinicalTrials.gov for registered studies, recruitment status, design, phase, dates and NCT identifiers.", {"query": str, "limit": int})
async def clinical_trials_tool(args: dict[str, Any]) -> dict[str, Any]:
    try:
        results = await search_clinical_trials(args["query"], args.get("limit", 5))
        return _as_tool_result({"source": "clinicaltrials", "query": args["query"], "results": results})
    except Exception as exc:
        return _as_tool_result({"source": "clinicaltrials", "error": f"ClinicalTrials.gov request failed: {type(exc).__name__}", "results": []})


def build_tool_server(enabled_sources: list[str] | None = None):
    from claude_agent_sdk import create_sdk_mcp_server
    enabled = set(enabled_sources or ["pubmed", "openfda", "clinicaltrials"])
    available = []
    if "pubmed" in enabled:
        available.append(pubmed_tool)
    if "openfda" in enabled:
        available.append(openfda_tool)
    if "clinicaltrials" in enabled:
        available.append(clinical_trials_tool)
    return create_sdk_mcp_server(name="medical_research", tools=available)


TOOL_NAMES = [
    "mcp__medical_research__search_pubmed",
    "mcp__medical_research__search_openfda_label",
    "mcp__medical_research__search_clinical_trials",
]
