"""Monte Carlo loss-exceedance simulation."""

from __future__ import annotations

import numpy as np

from .estimates import sample_pert
from .models import FairModel, SimulationResult


def simulate_annual_loss(model: FairModel, iterations: int = 20_000, seed: int = 42) -> SimulationResult:
    """Simulate aggregate annual loss using Poisson event counts and PERT loss inputs."""
    if iterations < 100:
        raise ValueError("iterations must be at least 100")
    rng = np.random.default_rng(seed)
    tef = sample_pert(model.threat_event_frequency, iterations, rng)
    vulnerability = np.clip(sample_pert(model.vulnerability, iterations, rng), 0, 1)
    event_counts = rng.poisson(tef * vulnerability)
    primary = sample_pert(model.primary_loss, iterations, rng)
    secondary_probability = np.clip(sample_pert(model.secondary_loss_probability, iterations, rng), 0, 1)
    secondary = sample_pert(model.secondary_loss, iterations, rng)
    per_event_loss = primary + rng.binomial(1, secondary_probability) * secondary
    annual_losses = event_counts * per_event_loss
    return SimulationResult(
        annual_losses=tuple(float(x) for x in annual_losses),
        mean=float(np.mean(annual_losses)),
        median=float(np.median(annual_losses)),
        percentile_90=float(np.percentile(annual_losses, 90)),
        percentile_95=float(np.percentile(annual_losses, 95)),
        percentile_99=float(np.percentile(annual_losses, 99)),
        probability_of_zero_loss=float(np.mean(annual_losses == 0)),
    )


def exceedance_curve(result: SimulationResult, points: int = 100) -> tuple[np.ndarray, np.ndarray]:
    """Return loss thresholds and probabilities that annual loss exceeds them."""
    losses = np.asarray(result.annual_losses)
    thresholds = np.linspace(0, max(float(losses.max()), 1), points)
    probabilities = np.asarray([(losses > threshold).mean() for threshold in thresholds])
    return thresholds, probabilities

