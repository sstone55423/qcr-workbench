import pytest

from qcr_core.models import FairModel, ThreePointEstimate, Treatment
from qcr_core.treatments import compare_treatment


def fixed(value):
    return ThreePointEstimate(value, value, value)


def test_treatment_reduces_risk_and_calculates_net_benefit():
    model = FairModel(fixed(2), fixed(0.5), fixed(100_000), fixed(0), fixed(0))
    result = compare_treatment(model, Treatment("MFA", 10_000, vulnerability_reduction=0.5))
    assert result.baseline_ale == pytest.approx(100_000)
    assert result.residual_ale == pytest.approx(50_000)
    assert result.net_benefit == pytest.approx(40_000)
    assert result.return_on_control == pytest.approx(4)

