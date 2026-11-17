from secrets import compare_digest, token_urlsafe
from typing import Any

from pymongo.asynchronous.collection import AsyncCollection

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


class BoardService:
    def __init__(self, collection: AsyncCollection[dict[str, Any]]) -> None:
        self._collection = collection

    async def create(self, request: CreateBoardRequest) -> CreatedPlayerAccess:
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
        await self._collection.insert_one(
            {"_id": board_id, "state": state.model_dump(), "tokens": [token]}
        )
        return CreatedPlayerAccess(
            boardId=board_id,
            playerId=player_id,
            role="white",
            token=token,
            board=board,
        )

    async def _get(self, board_id: str) -> tuple[BoardState, list[str]]:
        if not 1 <= len(board_id) <= 64:
            raise BoardError(400, "invalid_board_id", "Invalid board identifier")
        document = await self._collection.find_one({"_id": board_id})
        if document is None:
            raise BoardError(404, "board_not_found", "Board not found")
        return BoardState.model_validate(document["state"]), document["tokens"]

    @staticmethod
    def _authorize(tokens: list[str], token: str | None) -> None:
        if token is None or not any(
            compare_digest(token.encode("utf-8"), saved.encode("utf-8"))
            for saved in tokens
        ):
            raise BoardError(403, "invalid_token", "Invalid player token")

    async def join(self, board_id: str, preferred_role: PlayerRole | None) -> PlayerAccess:
        state, _ = await self._get(board_id)
        if state.gameState.status == "finished":
            raise BoardError(409, "board_finished", "Board is finished")

        available: list[PlayerRole] = [
            "black"
        ] if not any(player.role == "black" for player in state.gameState.players) else []
        if preferred_role is not None:
            available = [role for role in available if role == preferred_role]
        if not available:
            raise BoardError(409, "role_unavailable", "No requested role is available")

        role = available[0]
        player = Player(playerId=new_id("plr"), role=role)
        token = new_id("tok")
        result = await self._collection.update_one(
            {
                "_id": board_id,
                "state.gameState.players": [
                    existing.model_dump() for existing in state.gameState.players
                ],
                "state.gameState.status": {"$ne": "finished"},
            },
            {
                "$push": {
                    "state.gameState.players": player.model_dump(),
                    "tokens": token,
                },
                "$set": {"state.gameState.status": "in_progress"},
            },
        )
        if result.matched_count == 0:
            current_state, _ = await self._get(board_id)
            if current_state.gameState.status == "finished":
                raise BoardError(409, "board_finished", "Board is finished")
            raise BoardError(409, "role_unavailable", "No requested role is available")
        return PlayerAccess(
            boardId=board_id, playerId=player.playerId, role=role, token=token
        )

    async def get(self, board_id: str) -> BoardState:
        state, _ = await self._get(board_id)
        return state

    async def update(
        self, board_id: str, token: str | None, update: BoardStateUpdate
    ) -> BoardState:
        state, tokens = await self._get(board_id)
        self._authorize(tokens, token)
        if state.gameState.status == "finished":
            raise BoardError(409, "board_finished", "Board is finished")
        previous_state = state.model_copy(deep=True)
        state.gameState.status = update.gameState.status
        state.gameState.turn = update.gameState.turn
        if update.gameState.ruleSet is not None:
            state.gameState.ruleSet = update.gameState.ruleSet
        if "outcome" in update.gameState.model_fields_set:
            state.gameState.outcome = update.gameState.outcome
        state.board = update.board
        await self._save(board_id, previous_state, state, token, reject_finished=True)
        return state

    async def reset(
        self, board_id: str, token: str | None, rule_set: str | None
    ) -> BoardState:
        state, tokens = await self._get(board_id)
        self._authorize(tokens, token)
        previous_state = state.model_copy(deep=True)
        state.gameState.status = (
            "in_progress"
            if any(player.role == "black" for player in state.gameState.players)
            else "waiting"
        )
        state.gameState.turn = "white"
        state.gameState.outcome = None
        if rule_set is not None:
            state.gameState.ruleSet = rule_set
        state.board = initial_board()
        await self._save(board_id, previous_state, state, token)
        return state

    async def _save(
        self,
        board_id: str,
        previous_state: BoardState,
        state: BoardState,
        token: str | None,
        reject_finished: bool = False,
    ) -> None:
        result = await self._collection.update_one(
            {
                "_id": board_id,
                "state": previous_state.model_dump(),
                "tokens": token,
            },
            {"$set": {"state": state.model_dump()}},
        )
        if result.matched_count == 0:
            current_state, tokens = await self._get(board_id)
            self._authorize(tokens, token)
            if reject_finished and current_state.gameState.status == "finished":
                raise BoardError(409, "board_finished", "Board is finished")
            raise BoardError(
                409, "board_changed", "Board state changed; refresh and retry"
            )
