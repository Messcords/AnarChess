from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

import mongodb
from api.boards import router as boards_router
from services.boards import BoardError


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongodb.connect(app)
    try:
        yield
    finally:
        await mongodb.close(app)


app = FastAPI(
    title="My Backend API",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(boards_router)

@app.exception_handler(BoardError)
async def board_error_handler(request: Request, exc: BoardError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code, content={"code": exc.code, "message": exc.message}
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    if request.method == "POST" and request.url.path == "/boards":
        return JSONResponse(
            status_code=400, content={"detail": "Invalid request parameters"}
        )
    return JSONResponse(
        status_code=400,
        content={"code": "invalid_request", "message": "Invalid request parameters"},
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}
