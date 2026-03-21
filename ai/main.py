"""
Luminance AI Service — scaffold only, no business logic.
Process name: luminance-ai
Listens on:   0.0.0.0:8001
"""
from fastapi import FastAPI

app = FastAPI(title="Luminance AI", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "luminance-ai"}
