import numpy as np
import pytest

from qcr_core.estimates import pert_mean, sample_pert
from qcr_core.models import ThreePointEstimate


def test_estimate_rejects_invalid_order():
    with pytest.raises(ValueError):
        ThreePointEstimate(10, 5, 20)


def test_pert_mean_and_samples_are_bounded():
    estimate = ThreePointEstimate(1, 4, 10)
    assert pert_mean(estimate) == pytest.approx(4.5)
    samples = sample_pert(estimate, 1_000, np.random.default_rng(7))
    assert samples.min() >= 1
    assert samples.max() <= 10

