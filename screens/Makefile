PNPM ?= pnpm
.DEFAULT_GOAL := help

.PHONY: help install serve build preview check lint fix

help:
	@printf '%s\n' \
		'Usage: make <target>' \
		'' \
		'Targets:' \
		'  help    Display this help message (default)' \
		'  install Install project dependencies' \
		'  serve   Start the development server with automatic reload' \
		'  build   Build the application for production' \
		'  preview Preview the production build' \
		'  check   Run lint and tests' \
		'  lint    Check code with ESLint' \
		'  fix     Apply ESLint fixes'

install:
	$(PNPM) install

serve:
	$(PNPM) dev

build:
	$(PNPM) build

preview:
	$(PNPM) preview

check: lint
	$(PNPM) test:run

lint:
	$(PNPM) exec eslint .

fix:
	$(PNPM) exec eslint --fix .
