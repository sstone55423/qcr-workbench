"""FAIR decomposition and deterministic expected-loss calculations."""

from __future__ import annotations

from dataclasses import dataclass

from .estimates import pert_mean
from .models import FairModel


@dataclass(frozen=True)
class ExpectedLossResult:
    threat_event_frequency: float
    vulnerability: float
    loss_event_frequency: float
    primary_loss: float
    expected_secondary_loss: float
    loss_magnitude: float
    annualized_loss_expectancy: float


def expected_loss(model: FairModel) -> ExpectedLossResult:
    """Calculate FAIR factor means and annualized loss expectancy."""
    tef = pert_mean(model.threat_event_frequency)
    vulnerability = pert_mean(model.vulnerability)
    lef = tef * vulnerability
    primary = pert_mean(model.primary_loss)
    secondary = pert_mean(model.secondary_loss) * pert_mean(model.secondary_loss_probability)
    magnitude = primary + secondary
    return ExpectedLossResult(tef, vulnerability, lef, primary, secondary, magnitude, lef * magnitude)


def decomposition_rows(model: FairModel) -> list[dict[str, float | str]]:
    """Return display-ready FAIR inputs without coupling calculations to Streamlit."""
    factors = {
        "Threat Event Frequency": model.threat_event_frequency,
        "Vulnerability": model.vulnerability,
        "Primary Loss": model.primary_loss,
        "Secondary Loss": model.secondary_loss,
        "Secondary Loss Probability": model.secondary_loss_probability,
    }
    return [
        {
            "Factor": name,
            "Minimum": value.minimum,
            "Most likely": value.most_likely,
            "Maximum": value.maximum,
            "Unit": value.unit,
        }
        for name, value in factors.items()
    ]

