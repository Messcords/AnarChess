"""Pre-commit hook: run the load tests only when the commit needs them.

pre-commit calls this hook only when the staged files touch the API code
(routes, services, models, main.py: see .pre-commit-config.yaml). Then:

- always: the concurrency scenarios (load-race, load-create, about 10 s).
  They block the commit if a seat is given twice or a boardId is duplicated.
- also, when the change is large (LOAD_FULL_LINES changed lines or more, 50
  by default) or touches the routes (src/api/): a short full-game run (load).
  It blocks the commit on any failure or a p95 above LOAD_P95_LIMIT ms.

The hook starts its own API on a free port and stops it at the end. Reports
are written to docs/charge/. Skip it with: SKIP=load-test git commit ...
"""

import csv
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ENDPOINTS = Path(__file__).resolve().parents[1]
RESULTS = ENDPOINTS / "load" / "results"
FULL_LINES = int(os.environ.get("LOAD_FULL_LINES", "50"))
P95_LIMIT = float(os.environ.get("LOAD_P95_LIMIT", "200"))
CONCURRENT_USERS = "50"
WATCHED = ("src/api/", "src/services/", "src/models/", "src/main.py")


def staged_changes() -> dict[str, int]:
    """Changed lines per staged API file, relative to endpoints/."""
    output = subprocess.run(
        ["git", "diff", "--cached", "--numstat", "--relative", "--", "src"],
        cwd=ENDPOINTS,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    changes = {}
    for line in output.splitlines():
        added, removed, path = line.split("\t", 2)
        if path.startswith(WATCHED):
            changes[path] = int(added.replace("-", "0")) + int(
                removed.replace("-", "0")
            )
    return changes


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def start_api(port: int) -> subprocess.Popen:
    api = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--app-dir", "src"]
        + ["--port", str(port), "--log-level", "warning"],
        cwd=ENDPOINTS,
    )
    for _ in range(50):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=1)
            return api
        except OSError:
            time.sleep(0.2)
    api.kill()
    sys.exit("load-test: the API did not start")


def run_scenario(host: str, scenario: str, user_class: str, users: str) -> Path:
    prefix = RESULTS / scenario
    rate, duration = (users, "5s") if scenario != "player" else ("5", "10s")
    subprocess.run(
        [sys.executable, "-m", "locust", "-f", "load/locustfile.py"]
        + ["--host", host, "--headless", "-u", users, "-r", rate]
        + ["-t", duration, "--csv", str(prefix), "--only-summary", user_class],
        check=False,  # Locust exits 1 on failures; the report says which.
        cwd=ENDPOINTS,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        [sys.executable, "load/report.py", "--scenario", scenario]
        + ["--csv", str(prefix), "--host", host, "--users", users]
        + ["--spawn-rate", rate, "--duration", duration]
        + ["--p95-limit", str(P95_LIMIT)],
        cwd=ENDPOINTS,
        check=True,
    )
    return prefix


def outcomes(prefix: Path) -> dict[str, int]:
    path = Path(f"{prefix}_outcomes.json")
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def player_problems(prefix: Path) -> list[str]:
    with Path(f"{prefix}_stats.csv").open(encoding="utf-8", newline="") as file:
        rows = [row for row in csv.DictReader(file) if row["Name"] != "Aggregated"]
    problems = []
    for row in rows:
        route = f"{row['Type']} {row['Name']}"
        if int(row["Failure Count"]):
            problems.append(f"{route}: {row['Failure Count']} échec(s)")
        if float(row["95%"] or 0) > P95_LIMIT:
            problems.append(f"{route}: p95 {row['95%']} ms > {P95_LIMIT:.0f} ms")
    return problems


def main() -> int:
    changes = staged_changes()
    if not changes:
        return 0
    total = sum(changes.values())
    full = total >= FULL_LINES or any(path.startswith("src/api/") for path in changes)
    print(
        f"load-test: {len(changes)} fichier(s) API modifié(s), {total} ligne(s)"
        f" -> {'concurrence + parties complètes' if full else 'concurrence'}"
    )

    RESULTS.mkdir(parents=True, exist_ok=True)
    port = free_port()
    host = f"http://127.0.0.1:{port}"
    api = start_api(port)
    problems = []
    try:
        race = outcomes(run_scenario(host, "race", "SeatRace", CONCURRENT_USERS))
        if race.get("seat_won") != 1:
            problems.append(f"load-race: place accordée {race.get('seat_won', 0)} fois")
        create = outcomes(run_scenario(host, "create", "CreateRush", CONCURRENT_USERS))
        if create.get("duplicate") or create.get("created") != int(CONCURRENT_USERS):
            problems.append(
                f"load-create: {create.get('created', 0)} parties, "
                f"{create.get('duplicate', 0)} boardId en double"
            )
        if full:
            problems += player_problems(run_scenario(host, "player", "Player", "20"))
    finally:
        api.terminate()
        api.wait(timeout=10)

    if problems:
        print("load-test: commit bloqué, voir docs/charge/ :")
        print("\n".join(f"  - {problem}" for problem in problems))
        print("Pour passer outre : SKIP=load-test git commit ...")
        return 1
    print("load-test: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
