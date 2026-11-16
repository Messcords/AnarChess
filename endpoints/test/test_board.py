from fastapi.testclient import TestClient

from main import app


def test_create_board_returns_player_access() -> None:
    with TestClient(app) as client:
        response = client.post("/boards")

    assert response.status_code == 201
    player_access = response.json()

    assert set(player_access) == {"boardId", "playerId", "role", "token"}
    assert player_access["boardId"].startswith("brd_")
    assert player_access["board"] == [
        ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
        [None, None, None, None, None, None, None, None],
        [None, None, None, None, None, None, None, None],
        [None, None, None, None, None, None, None, None],
        [None, None, None, None, None, None, None, None],
        ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
        ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
    ]
    assert player_access["playerId"].startswith("plr_")
    assert player_access["role"] == "white"
    assert player_access["token"].startswith("tok_")


def test_create_board_rejects_invalid_parameters() -> None:
    with TestClient(app) as client:
        response = client.post("/boards", json={"includeJester": "not-a-boolean"})

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid request parameters"}
