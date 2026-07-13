"""Risk-treatment modeling and economic comparison."""

from __future__ import annotations

from dataclasses import dataclass, replace

from .fair import expected_loss
from .models import FairModel, ThreePointEstimate, Treatment


@dataclass(frozen=True)
class TreatmentComparison:
    baseline_ale: float
    residual_ale: float
    risk_reduction: float
    annual_cost: float
    net_benefit: float
    return_on_control: float | None


def _reduce(estimate: ThreePointEstimate, reduction: float) -> ThreePointEstimate:
    factor = 1 - reduction
    return replace(
        estimate,
        minimum=estimate.minimum * factor,
        most_likely=estimate.most_likely * factor,
        maximum=estimate.maximum * factor,
    )


def apply_treatment(model: FairModel, treatment: Treatment) -> FairModel:
    return FairModel(
        threat_event_frequency=_reduce(model.threat_event_frequency, treatment.frequency_reduction),
        vulnerability=_reduce(model.vulnerability, treatment.vulnerability_reduction),
        primary_loss=_reduce(model.primary_loss, treatment.primary_loss_reduction),
        secondary_loss=_reduce(model.secondary_loss, treatment.secondary_loss_reduction),
        secondary_loss_probability=model.secondary_loss_probability,
    )


def compare_treatment(model: FairModel, treatment: Treatment) -> TreatmentComparison:
    baseline = expected_loss(model).annualized_loss_expectancy
    residual = expected_loss(apply_treatment(model, treatment)).annualized_loss_expectancy
    reduction = baseline - residual
    net_benefit = reduction - treatment.annual_cost
    roc = net_benefit / treatment.annual_cost if treatment.annual_cost else None
    return TreatmentComparison(baseline, residual, reduction, treatment.annual_cost, net_benefit, roc)

