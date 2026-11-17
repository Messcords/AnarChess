UV ?= uv
.DEFAULT_GOAL := help

.PHONY: help install serve check contract load load-race load-create load-ui lint fix audit hooks

help:
	@printf '%s\n' \
		'Usage: make <target>' \
		'' \
		'Targets:' \
		'  help         Display this help message (default)' \
		'  install      Install project dependencies' \
		'  serve        Start the API with automatic reload' \
		'  check        Run tests' \
		'  contract     Run Schemathesis tests against docs/openapi.yaml' \
		'  load         Load test: full games (report in docs/charge/)' \
		'  load-race    Load test: 50 users join one free seat at once' \
		'  load-create  Load test: 50 users create a game at once' \
		'  load-ui      Start the Locust web UI on http://localhost:8089' \
		'  lint         Check code with Ruff' \
		'  fix          Apply Ruff fixes and formatting' \
		'  audit        Check dependencies for security vulnerabilities' \
		'  hooks        Install the pre-commit hook (load tests on API changes)'

install:
	$(UV) sync --no-install-project

serve:
	$(UV) run --no-sync uvicorn main:app --app-dir src --reload

check:
	$(UV) run --no-sync pytest

contract:
	$(UV) run --no-sync pytest -m fuzz test/test_schemathesis.py

HOST ?= http://127.0.0.1:8000
USERS ?= 20
SPAWN_RATE ?= 5
DURATION ?= 30s

RACE_USERS ?= 50
RACE_DURATION ?= 10s
LOCUST = $(UV) run --no-sync locust -f load/locustfile.py --host $(HOST)
REPORT = $(UV) run --no-sync python load/report.py --host $(HOST)

# The leading "-" keeps going when Locust reports failures, so the report
# (docs/charge/) is always written.
load:
	-$(LOCUST) --headless -u $(USERS) -r $(SPAWN_RATE) -t $(DURATION) --csv load/results/player Player
	$(REPORT) --scenario player --csv load/results/player --users $(USERS) --spawn-rate $(SPAWN_RATE) --duration $(DURATION)

load-race:
	-$(LOCUST) --headless -u $(RACE_USERS) -r $(RACE_USERS) -t $(RACE_DURATION) --csv load/results/race SeatRace
	$(REPORT) --scenario race --csv load/results/race --users $(RACE_USERS) --spawn-rate $(RACE_USERS) --duration $(RACE_DURATION)

load-create:
	-$(LOCUST) --headless -u $(RACE_USERS) -r $(RACE_USERS) -t $(RACE_DURATION) --csv load/results/create CreateRush
	$(REPORT) --scenario create --csv load/results/create --users $(RACE_USERS) --spawn-rate $(RACE_USERS) --duration $(RACE_DURATION)

load-ui:
	$(LOCUST)

lint:
	$(UV) run --no-sync ruff check .

fix:
	$(UV) run --no-sync ruff check --fix .
	$(UV) run --no-sync ruff format .

audit:
	$(UV) run --no-sync pip-audit

hooks:
	$(UV) run --no-sync pre-commit install
