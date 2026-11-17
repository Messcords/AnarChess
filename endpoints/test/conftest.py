import re
from copy import deepcopy
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

import mongodb

OPENAPI_PATH = Path(__file__).resolve().parents[2] / "docs" / "openapi.yaml"


def _value_at(document: dict[str, Any], path: str) -> Any:
    value: Any = document
    for part in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(part)
    return value


def _set_value(document: dict[str, Any], path: str, value: Any) -> None:
    parts = path.split(".")
    target = document
    for part in parts[:-1]:
        target = target.setdefault(part, {})
    target[parts[-1]] = value


class FakeCollection:
    def __init__(self) -> None:
        self.documents: dict[str, dict[str, Any]] = {}

    async def insert_one(self, document: dict[str, Any]) -> None:
        self.documents[document["_id"]] = deepcopy(document)

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        document = self.documents.get(query["_id"])
        if document is None:
            return None
        if self._matches(document, query):
            return deepcopy(document)
        return None

    async def update_one(
        self, query: dict[str, Any], update: dict[str, dict[str, Any]]
    ) -> SimpleNamespace:
        document = self.documents.get(query["_id"])
        if document is None or not self._matches(document, query):
            return SimpleNamespace(matched_count=0)
        for path, value in update.get("$set", {}).items():
            _set_value(document, path, deepcopy(value))
        for path, value in update.get("$push", {}).items():
            _value_at(document, path).append(deepcopy(value))
        return SimpleNamespace(matched_count=1)

    @staticmethod
    def _matches(document: dict[str, Any], query: dict[str, Any]) -> bool:
        for path, expected in query.items():
            actual = _value_at(document, path)
            if isinstance(expected, dict) and "$ne" in expected:
                if actual == expected["$ne"]:
                    return False
            elif isinstance(actual, list) and not isinstance(expected, list):
                if expected not in actual:
                    return False
            elif actual != expected:
                return False
        return True


class FakeDatabase:
    def __init__(self) -> None:
        self.collections = {"boards": FakeCollection()}

    def __getitem__(self, name: str) -> FakeCollection:
        return self.collections[name]


@pytest.fixture(autouse=True)
def no_mongo(monkeypatch: pytest.MonkeyPatch, fake_db: FakeDatabase) -> None:
    """Tests use an in-memory collection instead of opening a MongoDB connection."""

    async def fake_connect(app) -> None:
        app.state.mongo_client = None
        app.state.db = fake_db

    async def fake_close(app) -> None:
        pass

    monkeypatch.setattr(mongodb, "connect", fake_connect)
    monkeypatch.setattr(mongodb, "close", fake_close)


@pytest.fixture
def fake_db() -> FakeDatabase:
    return FakeDatabase()


# nodeid -> operationIds covered, filled at collection time
_contracts_by_test: dict[str, tuple[str, ...]] = {}
# nodeid -> final outcome ("passed", "failed", "skipped")
_outcomes: dict[str, str] = {}


def contract_operation_ids() -> list[str]:
    text = OPENAPI_PATH.read_text(encoding="utf-8")
    return re.findall(r"^\s*operationId:\s*(\w+)\s*$", text, re.MULTILINE)


def pytest_collection_modifyitems(
    config: pytest.Config, items: list[pytest.Item]
) -> None:
    """Fail fast if a test references an operationId missing from openapi.yaml."""
    known = set(contract_operation_ids())
    for item in items:
        operation_ids: list[str] = []
        for marker in item.iter_markers(name="contract"):
            unknown = set(marker.args) - known
            if unknown:
                raise pytest.UsageError(
                    f"{item.nodeid}: unknown contract operationId(s) "
                    f"{sorted(unknown)} - not found in {OPENAPI_PATH.name}"
                )
            operation_ids.extend(marker.args)
        if operation_ids:
            _contracts_by_test[item.nodeid] = tuple(operation_ids)


def pytest_runtest_logreport(report: pytest.TestReport) -> None:
    if report.failed:
        _outcomes[report.nodeid] = "failed"
    elif report.skipped:
        _outcomes.setdefault(report.nodeid, "skipped")
    elif report.when == "call":
        _outcomes.setdefault(report.nodeid, "passed")


def pytest_terminal_summary(terminalreporter) -> None:
    """Print, for each operationId of openapi.yaml, the tests covering it."""
    if not _contracts_by_test:
        return
    tr = terminalreporter
    tr.write_sep("=", "OpenAPI contract coverage")
    for operation_id in contract_operation_ids():
        tests = [
            nodeid
            for nodeid, ops in _contracts_by_test.items()
            if operation_id in ops and nodeid in _outcomes
        ]
        if not tests:
            tr.write_line(f"{operation_id}: NOT COVERED", yellow=True)
            continue
        all_passed = all(_outcomes[t] == "passed" for t in tests)
        tr.write_line(
            f"{operation_id}: {'OK' if all_passed else 'FAILED'}",
            green=all_passed,
            red=not all_passed,
            bold=True,
        )
        for nodeid in tests:
            outcome = _outcomes[nodeid].upper()
            tr.write_line(
                f"    {outcome:<8} {nodeid}",
                green=outcome == "PASSED",
                red=outcome == "FAILED",
            )
