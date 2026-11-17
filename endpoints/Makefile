UV ?= uv
.DEFAULT_GOAL := help

.PHONY: help install serve check contract lint fix audit

help:
	@printf '%s\n' \
		'Usage: make <target>' \
		'' \
		'Targets:' \
		'  help      Display this help message (default)' \
		'  install   Install project dependencies' \
		'  serve     Start the API with automatic reload' \
		'  check     Run tests' \
		'  contract  Run Schemathesis tests against docs/openapi.yaml' \
		'  lint      Check code with Ruff' \
		'  fix       Apply Ruff fixes and formatting' \
		'  audit     Check dependencies for security vulnerabilities'

install:
	$(UV) sync --no-install-project

serve:
	$(UV) run --no-sync uvicorn main:app --app-dir src --reload

check:
	$(UV) run --no-sync pytest

contract:
	$(UV) run --no-sync pytest -m fuzz test/test_schemathesis.py

lint:
	$(UV) run --no-sync ruff check .

fix:
	$(UV) run --no-sync ruff check --fix .
	$(UV) run --no-sync ruff format .

audit:
	$(UV) run --no-sync pip-audit
