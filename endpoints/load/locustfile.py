"""Load tests for the board API (docs/openapi.yaml).

Three scenarios (user classes):

- Player: each simulated user plays one game. White creates a board, black
  joins it, then the players poll the state, play moves and sometimes reset.
  Run with: make load (headless) or make load-ui (web UI on :8089).
- CreateRush: every user creates a game at the same moment. All must get
  201 with a distinct boardId. Run with: make load-create.
- SeatRace: one board with a single free seat (black), and every user asks
  for it at the same time. Exactly one join must succeed (200), the others
  must get 409. Run with: make load-race.

The API must be running first (make serve).
"""

import json
from collections import Counter
from copy import deepcopy
from pathlib import Path

import requests
from locust import HttpUser, between, constant, events, task

PLAYER_TOKEN = "X-Player-Token"
race_board_id: str | None = None
created_board_ids: set[str] = set()
# Scenario verdicts (seat_won, seat_full, created, duplicate), written next to
# the Locust CSV files at the end of the run and read by load/report.py.
outcomes: Counter[str] = Counter()


@events.test_start.add_listener
def create_race_board(environment, **_kwargs) -> None:
    """Create the board whose single free seat the SeatRace users fight for."""
    global race_board_id
    if SeatRace not in environment.user_classes:
        return
    response = requests.post(f"{environment.host}/boards", json={}, timeout=10)
    response.raise_for_status()
    race_board_id = response.json()["boardId"]


@events.test_stop.add_listener
def save_outcomes(environment, **_kwargs) -> None:
    prefix = getattr(environment.parsed_options, "csv_prefix", None)
    if prefix:
        path = Path(f"{prefix}_outcomes.json")
        path.write_text(json.dumps(dict(outcomes)), encoding="utf-8")


class Player(HttpUser):
    wait_time = between(0.5, 2)

    def on_start(self) -> None:
        with self.client.post(
            "/boards", json={"ruleSet": "standard"}, catch_response=True
        ) as response:
            if response.status_code != 201:
                response.failure(f"createBoard: {response.status_code}")
                self.stop()
                return
            created = response.json()
        self.board_id = created["boardId"]
        self.white_token = created["token"]
        self.board = created["board"]
        self.turn = "white"

        join = self.client.post(
            f"/boards/{self.board_id}/join",
            json={"preferredRole": "black"},
            name="/boards/{id}/join",
        )
        self.black_token = join.json()["token"] if join.ok else self.white_token

    @task(5)
    def get_board_state(self) -> None:
        self.client.get(f"/boards/{self.board_id}", name="/boards/{id}")

    @task(2)
    def update_board_state(self) -> None:
        board = deepcopy(self.board)
        # Move a pawn of the current player one square forward and back.
        if self.turn == "white":
            board[6][0], board[5][0] = board[5][0], board[6][0]
            token, next_turn = self.white_token, "black"
        else:
            board[1][0], board[2][0] = board[2][0], board[1][0]
            token, next_turn = self.black_token, "white"

        response = self.client.patch(
            f"/boards/{self.board_id}",
            json={
                "gameState": {"status": "in_progress", "turn": next_turn},
                "board": board,
            },
            headers={PLAYER_TOKEN: token},
            name="/boards/{id}",
        )
        if response.ok:
            self.board = board
            self.turn = next_turn

    @task(1)
    def reset_board(self) -> None:
        response = self.client.post(
            f"/boards/{self.board_id}/reset",
            json={},
            headers={PLAYER_TOKEN: self.white_token},
            name="/boards/{id}/reset",
        )
        if response.ok:
            self.board = response.json()["board"]
            self.turn = "white"


class SeatRace(HttpUser):
    """Every user asks once for the single free seat of the same board."""

    wait_time = constant(3600)

    @task
    def join_single_seat(self) -> None:
        with self.client.post(
            f"/boards/{race_board_id}/join",
            json={"preferredRole": "black"},
            catch_response=True,
            name="/boards/{id}/join",
        ) as response:
            outcome = {200: "seat_won", 409: "seat_full"}.get(response.status_code)
            if outcome is None:
                response.failure(f"unexpected status {response.status_code}")
                return
            response.success()
            outcomes[outcome] += 1


class CreateRush(HttpUser):
    """Every user creates one game at the same moment; all ids must differ."""

    wait_time = constant(3600)

    @task
    def create_game(self) -> None:
        with self.client.post(
            "/boards", json={"ruleSet": "standard"}, catch_response=True
        ) as response:
            if response.status_code != 201:
                response.failure(f"unexpected status {response.status_code}")
                return
            board_id = response.json()["boardId"]
            if board_id in created_board_ids:
                outcomes["duplicate"] += 1
                response.failure(f"duplicate boardId {board_id}")
                return
            created_board_ids.add(board_id)
            outcomes["created"] += 1
            response.success()
