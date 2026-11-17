from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Request

from models.board import (
    BoardState,
    BoardStateUpdate,
    CreateBoardError,
    CreateBoardRequest,
    CreatedPlayerAccess,
    Error,
    JoinBoardRequest,
    PlayerAccess,
    ResetBoardRequest,
)
from services.boards import BoardService

router = APIRouter(prefix="/boards", tags=["boards"])
errors: dict[int | str, dict[str, Any]] = {
    status: {"model": Error} for status in (400, 403, 404, 409)
}
PlayerToken = Annotated[str | None, Header(alias="X-Player-Token")]


def get_board_service(request: Request) -> BoardService:
    return BoardService(request.app.state.db["boards"])


BoardServiceDependency = Annotated[BoardService, Depends(get_board_service)]


@router.post(
    "",
    status_code=201,
    response_model=CreatedPlayerAccess,
    responses={400: {"model": CreateBoardError}},
)
async def create_board(
    service: BoardServiceDependency,
    request: CreateBoardRequest | None = None,
) -> CreatedPlayerAccess:
    return await service.create(request or CreateBoardRequest())


@router.post("/{id}/join", response_model=PlayerAccess, responses=errors)
async def join_board(
    id: str,
    service: BoardServiceDependency,
    request: JoinBoardRequest | None = None,
) -> PlayerAccess:
    return await service.join(id, request.preferredRole if request else None)


@router.get("/{id}", response_model=BoardState, responses=errors)
async def get_board(
    id: str, service: BoardServiceDependency
) -> BoardState:
    return await service.get(id)


@router.patch("/{id}", response_model=BoardState, responses=errors)
async def update_board(
    id: str,
    request: BoardStateUpdate,
    service: BoardServiceDependency,
    token: PlayerToken = None,
) -> BoardState:
    return await service.update(id, token, request)


@router.post("/{id}/reset", response_model=BoardState, responses=errors)
async def reset_board(
    id: str,
    service: BoardServiceDependency,
    request: ResetBoardRequest | None = None,
    token: PlayerToken = None,
) -> BoardState:
    return await service.reset(id, token, request.ruleSet if request else None)
