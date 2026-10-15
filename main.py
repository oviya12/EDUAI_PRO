from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router

app = FastAPI(
    title="Medical Research Chatbot API",
    version="0.1.0",
    description="Evidence-grounded research assistant for PubMed, openFDA, and ClinicalTrials.gov.",
)

# Local React development server. Restrict this list further in deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(chat_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "medical-research-chatbot"}
