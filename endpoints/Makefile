UV ?= uv
.DEFAULT_GOAL := help

.PHONY: help install serve check lint fix

help:
	@printf '%s\n' \
		'Usage: make <target>' \
		'' \
		'Targets:' \
		'  help   Display this help message (default)' \
		'  install Install project dependencies' \
		'  serve  Start the API with automatic reload' \
		'  check  Run lint and tests' \
		'  lint   Check code with Ruff' \
		'  fix    Apply Ruff fixes and formatting'

install:
	$(UV) sync --no-install-project

serve:
	$(UV) run --no-sync uvicorn main:app --app-dir src --reload

check: lint
	$(UV) run --no-sync pytest

lint:
	$(UV) run --no-sync ruff check .

fix:
	$(UV) run --no-sync ruff check --fix .
	$(UV) run --no-sync ruff format .
