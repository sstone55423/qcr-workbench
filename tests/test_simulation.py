from qcr_core.models import FairModel, ThreePointEstimate
from qcr_core.simulation import simulate_annual_loss


def fixed(value):
    return ThreePointEstimate(value, value, value)


def test_simulation_is_reproducible():
    model = FairModel(fixed(1), fixed(0.5), fixed(100), fixed(50), fixed(0.2))
    first = simulate_annual_loss(model, 1_000, seed=123)
    second = simulate_annual_loss(model, 1_000, seed=123)
    assert first.annual_losses == second.annual_losses
    assert first.percentile_95 >= first.median
    assert 0 <= first.probability_of_zero_loss <= 1

