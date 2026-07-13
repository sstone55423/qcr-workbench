import pytest

from qcr_core.fair import expected_loss
from qcr_core.models import FairModel, ThreePointEstimate


def fixed(value, unit=""):
    return ThreePointEstimate(value, value, value, unit)


def test_expected_loss_decomposition():
    model = FairModel(fixed(2), fixed(0.25), fixed(100_000), fixed(50_000), fixed(0.2))
    result = expected_loss(model)
    assert result.loss_event_frequency == pytest.approx(0.5)
    assert result.expected_secondary_loss == pytest.approx(10_000)
    assert result.loss_magnitude == pytest.approx(110_000)
    assert result.annualized_loss_expectancy == pytest.approx(55_000)

