from fastapi.testclient import TestClient

from main import app


def test_create_board_returns_player_access() -> None:
    with TestClient(app) as client:
        response = client.post("/boards")

    assert response.status_code == 201
    player_access = response.json()

    assert set(player_access) == {"boardId", "board", "playerId", "role", "token"}
    assert player_access["boardId"].startswith("brd_")
    assert player_access["board"] == [
        ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
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


def test_get_board_state() -> None:
    with TestClient(app) as client:
        invalid_response = client.get(f"/boards/{'x' * 65}")
        assert invalid_response.status_code == 400
        assert isinstance(invalid_response.json()["code"], str)
        assert isinstance(invalid_response.json()["message"], str)

        missing_response = client.get("/boards/brd_nonexistent")
        assert missing_response.status_code == 404
        assert isinstance(missing_response.json()["code"], str)
        assert isinstance(missing_response.json()["message"], str)

        created_response = client.post("/boards", json={"includeJester": False})
        assert created_response.status_code == 201
        white_player = created_response.json()
        board_id = white_player["boardId"]

        joined_response = client.post(f"/boards/{board_id}/join")
        assert joined_response.status_code == 200
        black_player = joined_response.json()

        response = client.get(f"/boards/{board_id}")

    assert response.status_code == 200
    state = response.json()
    assert state["id"] == board_id
    assert state["gameState"]["status"] == "in_progress"
    assert state["gameState"]["turn"] == "white"
    assert state["gameState"]["ruleSet"] == "standard"
    assert state["gameState"]["outcome"] is None
    assert sorted(state["gameState"]["players"], key=lambda player: player["role"]) == [
        {"playerId": black_player["playerId"], "role": "black"},
        {"playerId": white_player["playerId"], "role": "white"},
    ]
    assert state["board"] == [
        ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
        ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
    ]
