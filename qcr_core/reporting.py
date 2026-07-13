"""Executive-facing summaries with no dependency on Streamlit."""

from __future__ import annotations

from .fair import ExpectedLossResult
from .models import Scenario, SimulationResult
from .treatments import TreatmentComparison


def currency(value: float) -> str:
    return f"${value:,.0f}"


def executive_summary(
    scenario: Scenario,
    expected: ExpectedLossResult,
    simulation: SimulationResult | None = None,
    treatment: TreatmentComparison | None = None,
) -> str:
    lines = [
        f"# Quantitative Cyber Risk Report: {scenario.name}",
        "",
        f"**Risk statement:** {scenario.description}",
        f"**Accountable owner:** {scenario.owner}",
        "",
        "## Financial exposure",
        "",
        f"The modeled annualized loss expectancy is **{currency(expected.annualized_loss_expectancy)}**, "
        f"based on {expected.loss_event_frequency:.2f} expected loss events per year and "
        f"{currency(expected.loss_magnitude)} expected loss per event.",
    ]
    if simulation:
        tail_multiple = simulation.percentile_95 / expected.annualized_loss_expectancy if expected.annualized_loss_expectancy else 0
        lines.extend(
            [
                "",
                f"Monte Carlo analysis estimates a 95th-percentile annual loss of **{currency(simulation.percentile_95)}**.",
                "",
                "### How to interpret the difference",
                "",
                "The annualized loss expectancy and the 95th percentile answer different questions. "
                "ALE is the long-run average loss across many years; it is the appropriate comparison to the simulated mean. "
                "The 95th percentile is a tail-risk threshold: only 5% of simulated years produce a larger loss.",
                "",
                "| Measure | Annual loss | Interpretation |",
                "|---|---:|---|",
                f"| Deterministic ALE | {currency(expected.annualized_loss_expectancy)} | Long-run expected loss |",
                f"| Simulated mean | {currency(simulation.mean)} | Monte Carlo estimate of average loss |",
                f"| Simulated median | {currency(simulation.median)} | Half of simulated years are below this value |",
                f"| 90th percentile | {currency(simulation.percentile_90)} | 10% of simulated years are higher |",
                f"| 95th percentile | {currency(simulation.percentile_95)} | 5% of simulated years are higher |",
                f"| 99th percentile | {currency(simulation.percentile_99)} | 1% of simulated years are higher |",
                "",
                f"The 95th-percentile loss is **{tail_multiple:.1f}× the ALE**, reflecting uncertainty in event frequency and loss magnitude, "
                "the possibility of multiple events in one year, and infrequent high-cost outcomes. "
                f"The model also estimates a **{simulation.probability_of_zero_loss:.1%} probability of no loss event** in a given year. "
                "This combination of many low- or no-loss years and a small number of severe years creates a right-skewed distribution.",
            ]
        )
    if treatment:
        lines.extend(["", "## Proposed treatment", "", f"Treatment reduces expected annual loss by **{currency(treatment.risk_reduction)}**; net annual benefit is **{currency(treatment.net_benefit)}**."])
    lines.extend(["", "## Key assumptions", "", *[f"- {item}" for item in scenario.assumptions]])
    return "\n".join(lines)
