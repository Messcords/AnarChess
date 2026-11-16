from dataclasses import dataclass
from secrets import compare_digest, token_urlsafe
from threading import RLock

from models.board import (
    Board,
    BoardState,
    BoardStateUpdate,
    CreateBoardRequest,
    CreatedPlayerAccess,
    GameState,
    Player,
    PlayerAccess,
    PlayerRole,
)


def initial_board() -> Board:
    return [
        ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        ["bP"] * 8,
        *[[""] * 8 for _ in range(4)],
        ["wP"] * 8,
        ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
    ]


def new_id(prefix: str) -> str:
    return f"{prefix}_{token_urlsafe(18)}"


class BoardError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


@dataclass
class StoredBoard:
    state: BoardState
    tokens: list[str]


class BoardService:
    def __init__(self) -> None:
        self._boards: dict[str, StoredBoard] = {}
        self._lock = RLock()

    def create(self, request: CreateBoardRequest) -> CreatedPlayerAccess:
        with self._lock:
            board_id = new_id("brd")
            player_id = new_id("plr")
            token = new_id("tok")
            board = initial_board()
            state = BoardState(
                id=board_id,
                gameState=GameState(
                    status="waiting",
                    turn="white",
                    ruleSet=request.ruleSet,
                    players=[Player(playerId=player_id, role="white")],
                ),
                board=board,
            )
            self._boards[board_id] = StoredBoard(state, [token])
            return CreatedPlayerAccess(
                boardId=board_id,
                playerId=player_id,
                role="white",
                token=token,
                board=board,
            )

    def _get(self, board_id: str) -> StoredBoard:
        if not 1 <= len(board_id) <= 64:
            raise BoardError(400, "invalid_board_id", "Invalid board identifier")
        board = self._boards.get(board_id)
        if board is None:
            raise BoardError(404, "board_not_found", "Board not found")
        return board

    @staticmethod
    def _authorize(board: StoredBoard, token: str | None) -> None:
        if token is None or not any(
            compare_digest(token.encode("utf-8"), saved.encode("utf-8"))
            for saved in board.tokens
        ):
            raise BoardError(403, "invalid_token", "Invalid player token")

    def join(self, board_id: str, preferred_role: PlayerRole | None) -> PlayerAccess:
        with self._lock:
            board = self._get(board_id)
            if board.state.gameState.status == "finished":
                raise BoardError(409, "board_finished", "Board is finished")
            roles: list[PlayerRole] = ["black"]
            occupied = {player.role for player in board.state.gameState.players}
            available: list[PlayerRole] = [
                role for role in roles if role not in occupied
            ]
            if preferred_role is not None:
                available = [role for role in available if role == preferred_role]
            if not available:
                raise BoardError(
                    409, "role_unavailable", "No requested role is available"
                )
            role = available[0]
            player = Player(playerId=new_id("plr"), role=role)
            token = new_id("tok")
            board.state.gameState.players.append(player)
            board.tokens.append(token)
            if role == "black":
                board.state.gameState.status = "in_progress"
            return PlayerAccess(
                boardId=board_id, playerId=player.playerId, role=role, token=token
            )

    def get(self, board_id: str) -> BoardState:
        with self._lock:
            return self._get(board_id).state.model_copy(deep=True)

    def update(
        self, board_id: str, token: str | None, update: BoardStateUpdate
    ) -> BoardState:
        with self._lock:
            board = self._get(board_id)
            self._authorize(board, token)
            if board.state.gameState.status == "finished":
                raise BoardError(409, "board_finished", "Board is finished")
            state = board.state.gameState
            state.status = update.gameState.status
            state.turn = update.gameState.turn
            if update.gameState.ruleSet is not None:
                state.ruleSet = update.gameState.ruleSet
            if "outcome" in update.gameState.model_fields_set:
                state.outcome = update.gameState.outcome
            board.state.board = update.board
            return board.state.model_copy(deep=True)

    def reset(
        self, board_id: str, token: str | None, rule_set: str | None
    ) -> BoardState:
        with self._lock:
            board = self._get(board_id)
            self._authorize(board, token)
            state = board.state.gameState
            state.status = (
                "in_progress"
                if any(p.role == "black" for p in state.players)
                else "waiting"
            )
            state.turn = "white"
            state.outcome = None
            if rule_set is not None:
                state.ruleSet = rule_set
            board.state.board = initial_board()
            return board.state.model_copy(deep=True)
