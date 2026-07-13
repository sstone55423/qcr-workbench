"""Load and deserialize example or user-provided risk scenarios."""

from __future__ import annotations

import json
from pathlib import Path

from .models import FairModel, Scenario, ThreePointEstimate

DEFAULT_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "stella_polaris_scenarios.json"


def _estimate(data: dict[str, object]) -> ThreePointEstimate:
    return ThreePointEstimate(
        minimum=float(data["minimum"]),
        most_likely=float(data["most_likely"]),
        maximum=float(data["maximum"]),
        unit=str(data.get("unit", "")),
    )


def load_scenarios(path: str | Path = DEFAULT_DATA_PATH) -> list[Scenario]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    scenarios = []
    for item in raw:
        fair = item["fair"]
        scenarios.append(
            Scenario(
                id=item["id"], name=item["name"], description=item["description"],
                asset=item["asset"], threat=item["threat"], effect=item["effect"], owner=item["owner"],
                fair=FairModel(**{key: _estimate(value) for key, value in fair.items()}),
                assumptions=tuple(item.get("assumptions", [])),
            )
        )
    return scenarios


def scenario_by_id(scenario_id: str, path: str | Path = DEFAULT_DATA_PATH) -> Scenario:
    for scenario in load_scenarios(path):
        if scenario.id == scenario_id:
            return scenario
    raise KeyError(f"Unknown scenario: {scenario_id}")

