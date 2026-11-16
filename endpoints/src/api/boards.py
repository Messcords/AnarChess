from typing import Annotated, Any

from fastapi import APIRouter, Header

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
service = BoardService()
errors: dict[int | str, dict[str, Any]] = {
    status: {"model": Error} for status in (400, 403, 404, 409)
}
PlayerToken = Annotated[str | None, Header(alias="X-Player-Token")]


@router.post(
    "",
    status_code=201,
    response_model=CreatedPlayerAccess,
    responses={400: {"model": CreateBoardError}},
)
def create_board(request: CreateBoardRequest | None = None) -> CreatedPlayerAccess:
    return service.create(request or CreateBoardRequest())


@router.post("/{id}/join", response_model=PlayerAccess, responses=errors)
def join_board(id: str, request: JoinBoardRequest | None = None) -> PlayerAccess:
    return service.join(id, request.preferredRole if request else None)


@router.get("/{id}", response_model=BoardState, responses=errors)
def get_board(id: str) -> BoardState:
    return service.get(id)


@router.patch("/{id}", response_model=BoardState, responses=errors)
def update_board(
    id: str, request: BoardStateUpdate, token: PlayerToken = None
) -> BoardState:
    return service.update(id, token, request)


@router.post("/{id}/reset", response_model=BoardState, responses=errors)
def reset_board(
    id: str, request: ResetBoardRequest | None = None, token: PlayerToken = None
) -> BoardState:
    return service.reset(id, token, request.ruleSet if request else None)
