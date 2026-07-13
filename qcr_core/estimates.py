"""Three-point estimate utilities."""

from __future__ import annotations

import numpy as np

from .models import ThreePointEstimate


def pert_mean(estimate: ThreePointEstimate, shape: float = 4.0) -> float:
    """Return the mean of a modified PERT distribution."""
    return (estimate.minimum + shape * estimate.most_likely + estimate.maximum) / (shape + 2)


def sample_pert(
    estimate: ThreePointEstimate,
    size: int,
    rng: np.random.Generator,
    shape: float = 4.0,
) -> np.ndarray:
    """Sample a bounded modified PERT distribution."""
    if size < 1:
        raise ValueError("size must be at least 1")
    low, mode, high = estimate.minimum, estimate.most_likely, estimate.maximum
    if low == high:
        return np.full(size, low, dtype=float)
    mean = (low + shape * mode + high) / (shape + 2)
    alpha = 1 + shape * (mean - low) / (high - low)
    beta = 1 + shape * (high - mean) / (high - low)
    return low + rng.beta(alpha, beta, size=size) * (high - low)

