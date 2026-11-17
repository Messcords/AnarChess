import re
from pathlib import Path

import pytest

import mongodb

OPENAPI_PATH = Path(__file__).resolve().parents[2] / "docs" / "openapi.yaml"


@pytest.fixture(autouse=True)
def no_mongo(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests never open a MongoDB connection (no routes use the database yet)."""

    async def fake_connect(app) -> None:
        app.state.mongo_client = None
        app.state.db = None

    async def fake_close(app) -> None:
        pass

    monkeypatch.setattr(mongodb, "connect", fake_connect)
    monkeypatch.setattr(mongodb, "close", fake_close)


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
