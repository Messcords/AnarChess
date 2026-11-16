from copy import deepcopy

from fastapi.testclient import TestClient

from main import app


def test_join_roles_and_capacity() -> None:
    with TestClient(app) as client:
        white = client.post("/boards").json()
        board_id = white["boardId"]
        jester = client.post(
            f"/boards/{board_id}/join", json={"preferredRole": "jester"}
        )
        assert jester.status_code == 200
        assert jester.json()["role"] == "jester"
        assert (
            client.get(f"/boards/{board_id}").json()["gameState"]["status"] == "waiting"
        )
        black = client.post(f"/boards/{board_id}/join")
        assert black.status_code == 200
        assert black.json()["role"] == "black"
        assert client.post(f"/boards/{board_id}/join").status_code == 409
        assert client.post("/boards/brd_missing/join").status_code == 404

        no_jester = client.post("/boards", json={"includeJester": False}).json()
        no_jester_id = no_jester["boardId"]
        assert (
            client.post(
                f"/boards/{no_jester_id}/join", json={"preferredRole": "jester"}
            ).status_code
            == 409
        )
        assert (
            client.post(
                f"/boards/{no_jester_id}/join", json={"preferredRole": "invalid"}
            ).status_code
            == 400
        )
        assert client.post("/boards", json={"includeJester": 1}).status_code == 400
        assert client.post("/boards", content="{").status_code == 400


def test_update_and_reset_board() -> None:
    with TestClient(app) as client:
        white = client.post("/boards", json={"includeJester": False}).json()
        board_id = white["boardId"]
        black = client.post(f"/boards/{board_id}/join").json()
        headers = {"X-Player-Token": black["token"]}
        board = deepcopy(white["board"])
        board[6][0] = None
        board[4][0] = "wP"
        payload = {
            "gameState": {"status": "in_progress", "turn": "black"},
            "board": board,
        }
        assert client.patch(f"/boards/{board_id}", json=payload).status_code == 403
        assert (
            client.patch(
                f"/boards/{board_id}",
                json=payload,
                headers={"X-Player-Token": "invalid"},
            ).status_code
            == 403
        )
        assert (
            client.patch(
                f"/boards/{board_id}", json={**payload, "board": [[]]}, headers=headers
            ).status_code
            == 400
        )

        updated = client.patch(f"/boards/{board_id}", json=payload, headers=headers)
        assert updated.status_code == 200
        assert updated.json()["board"] == board
        assert updated.json()["gameState"]["turn"] == "black"
        assert len(updated.json()["gameState"]["players"]) == 2
        assert client.get(f"/boards/{board_id}").json() == updated.json()

        payload["gameState"] = {
            "status": "finished",
            "turn": "black",
            "outcome": {"winner": "white", "reason": "no_pieces_left"},
        }
        assert (
            client.patch(
                f"/boards/{board_id}", json=payload, headers=headers
            ).status_code
            == 200
        )
        assert (
            client.patch(
                f"/boards/{board_id}", json=payload, headers=headers
            ).status_code
            == 409
        )
        assert client.post(f"/boards/{board_id}/join").status_code == 409
        assert client.post(f"/boards/{board_id}/reset").status_code == 403
        reset = client.post(
            f"/boards/{board_id}/reset", json={"ruleSet": "custom"}, headers=headers
        )
        assert reset.status_code == 200
        assert reset.json()["board"] == white["board"]
        assert reset.json()["gameState"] == {
            "status": "in_progress",
            "turn": "white",
            "ruleSet": "custom",
            "players": [
                {"playerId": white["playerId"], "role": "white"},
                {"playerId": black["playerId"], "role": "black"},
            ],
            "outcome": None,
        }


def test_reset_waiting_board_and_missing_board_errors() -> None:
    with TestClient(app) as client:
        white = client.post("/boards", json={"ruleSet": "custom"}).json()
        board_id = white["boardId"]
        headers = {"X-Player-Token": white["token"]}
        reset = client.post(f"/boards/{board_id}/reset", headers=headers)
        assert reset.status_code == 200
        assert reset.json()["gameState"]["status"] == "waiting"
        assert reset.json()["gameState"]["ruleSet"] == "custom"
        missing = client.post("/boards/brd_missing/reset", headers=headers)
        assert missing.status_code == 404
        assert set(missing.json()) == {"code", "message"}


def test_generated_openapi_describes_board_matrix() -> None:
    with TestClient(app) as client:
        schema = client.get("/openapi.json").json()

    assert set(schema["paths"]["/boards/{id}"]) == {"get", "patch"}
    assert "post" in schema["paths"]["/boards/{id}/join"]
    assert "post" in schema["paths"]["/boards/{id}/reset"]
    board = schema["components"]["schemas"]["BoardState"]["properties"]["board"]
    assert board["type"] == "array"
    assert board["minItems"] == board["maxItems"] == 8
    assert board["items"]["minItems"] == board["items"]["maxItems"] == 8
    access = schema["components"]["schemas"]["CreatedPlayerAccess"]
    assert "board" in access["required"]
