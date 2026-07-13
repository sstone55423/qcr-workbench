from qcr_core.fair import ExpectedLossResult
from qcr_core.models import FairModel, Scenario, SimulationResult, ThreePointEstimate
from qcr_core.reporting import executive_summary


def test_report_explains_ale_and_tail_loss_difference():
    fixed = ThreePointEstimate(1, 1, 1)
    scenario = Scenario("test", "Test", "Test risk.", "Asset", "Threat", "Effect", "Owner", FairModel(fixed, fixed, fixed, fixed, fixed))
    expected = ExpectedLossResult(1, 0.5, 0.5, 100, 20, 120, 60)
    simulation = SimulationResult((0, 100, 500), 200, 100, 400, 500, 600, 1 / 3)

    report = executive_summary(scenario, expected, simulation)

    assert "How to interpret the difference" in report
    assert "long-run average" in report
    assert "tail-risk threshold" in report
    assert "probability of no loss event" in report
