"""Temporary in-memory conversation storage. Replace with PostgreSQL later."""
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

_conversations: dict[str, list[dict[str, Any]]] = defaultdict(list)


def get_or_create_conversation(conversation_id: str | None) -> str:
    if conversation_id and conversation_id in _conversations:
        return conversation_id
    new_id = str(uuid4())
    _conversations[new_id] = []
    return new_id


def get_history(conversation_id: str) -> list[dict[str, Any]]:
    return list(_conversations.get(conversation_id, []))


def add_turn(conversation_id: str, role: str, content: str) -> None:
    _conversations[conversation_id].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    # Keep the last 20 messages for the prototype.
    _conversations[conversation_id] = _conversations[conversation_id][-20:]


def list_conversations() -> list[dict[str, Any]]:
    return [
        {
            "conversation_id": cid,
            "messages": len(messages),
            "last_message_at": messages[-1]["timestamp"] if messages else None,
        }
        for cid, messages in _conversations.items()
    ]
