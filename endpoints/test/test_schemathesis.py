"""Property-based contract tests generated from docs/openapi.yaml.

Schemathesis generates requests for every operation of the contract and
checks that the API answers as documented (status codes, response schemas,
content types, no server errors).

Run with: make contract
"""

from pathlib import Path

import pytest
import schemathesis

from main import app

OPENAPI_PATH = Path(__file__).resolve().parents[2] / "docs" / "openapi.yaml"

schema = schemathesis.openapi.from_path(OPENAPI_PATH)
schema.app = app


@pytest.mark.fuzz
@schema.parametrize()
def test_api_matches_openapi_contract(case: schemathesis.Case) -> None:
    case.call_and_validate()
