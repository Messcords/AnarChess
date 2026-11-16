from fastapi import FastAPI

app = FastAPI(
    title="My Backend API",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
