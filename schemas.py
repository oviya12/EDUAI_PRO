from typing import Literal
from pydantic import BaseModel, Field


SourceType = Literal["pubmed", "openfda", "clinicaltrials"]


class SourceFilter(BaseModel):
    pubmed: bool = True
    openfda: bool = True
    clinicaltrials: bool = True


class ChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=4000)
    conversation_id: str | None = None
    sources: SourceFilter = Field(default_factory=SourceFilter)


class Citation(BaseModel):
    source_type: SourceType
    title: str
    url: str
    identifier: str
    citation: str = ""
    published_date: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    citations: list[Citation]
