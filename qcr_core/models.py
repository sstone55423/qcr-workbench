"""Domain models shared by every calculation module and UI page."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ThreePointEstimate:
    minimum: float
    most_likely: float
    maximum: float
    unit: str = ""

    def __post_init__(self) -> None:
        if self.minimum < 0 or self.minimum > self.most_likely or self.most_likely > self.maximum:
            raise ValueError("Estimate must satisfy 0 <= minimum <= most_likely <= maximum")


@dataclass(frozen=True)
class FairModel:
    threat_event_frequency: ThreePointEstimate
    vulnerability: ThreePointEstimate
    primary_loss: ThreePointEstimate
    secondary_loss: ThreePointEstimate
    secondary_loss_probability: ThreePointEstimate


@dataclass(frozen=True)
class Scenario:
    id: str
    name: str
    description: str
    asset: str
    threat: str
    effect: str
    owner: str
    fair: FairModel
    assumptions: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class Treatment:
    name: str
    annual_cost: float
    frequency_reduction: float = 0.0
    vulnerability_reduction: float = 0.0
    primary_loss_reduction: float = 0.0
    secondary_loss_reduction: float = 0.0

    def __post_init__(self) -> None:
        if self.annual_cost < 0:
            raise ValueError("Treatment cost cannot be negative")
        for value in (
            self.frequency_reduction,
            self.vulnerability_reduction,
            self.primary_loss_reduction,
            self.secondary_loss_reduction,
        ):
            if not 0 <= value <= 1:
                raise ValueError("Treatment reductions must be between 0 and 1")


@dataclass(frozen=True)
class SimulationResult:
    annual_losses: tuple[float, ...]
    mean: float
    median: float
    percentile_90: float
    percentile_95: float
    percentile_99: float
    probability_of_zero_loss: float

