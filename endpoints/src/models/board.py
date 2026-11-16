from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictStr

PlayerRole = Literal["white", "black", "jester"]
BoardStatus = Literal["waiting", "in_progress", "finished"]
BoardRow = Annotated[list[StrictStr], Field(min_length=8, max_length=8)]
Board = Annotated[list[BoardRow], Field(min_length=8, max_length=8)]


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CreateBoardRequest(RequestModel):
    includeJester: StrictBool = True
    ruleSet: StrictStr = "standard"


class JoinBoardRequest(RequestModel):
    preferredRole: PlayerRole | None = None


class ResetBoardRequest(RequestModel):
    ruleSet: StrictStr | None = None


class Player(BaseModel):
    playerId: str
    role: PlayerRole


class PlayerAccess(Player):
    boardId: str
    token: str


class CreatedPlayerAccess(PlayerAccess):
    board: Board


class GameOutcome(BaseModel):
    winner: PlayerRole | None
    reason: Literal["no_pieces_left", "specific_rule"]


class GameState(BaseModel):
    status: BoardStatus
    turn: PlayerRole
    ruleSet: str = "standard"
    players: list[Player]
    outcome: GameOutcome | None = None


class GameStateUpdate(RequestModel):
    status: BoardStatus
    turn: PlayerRole
    ruleSet: StrictStr | None = None
    outcome: GameOutcome | None = None


class BoardState(BaseModel):
    id: str
    gameState: GameState
    board: Board


class BoardStateUpdate(RequestModel):
    gameState: GameStateUpdate
    board: Board


class Error(BaseModel):
    code: str
    message: str


class CreateBoardError(BaseModel):
    detail: str
