import streamlit as st

from qcr_core.fair import expected_loss
from ui_shared import active_model, configure_page, metric_card_row, money, selected_scenario

configure_page("Expected Loss")
scenario = selected_scenario()
result = expected_loss(active_model(scenario))

metric_card_row(
    [
        ("Threat Event Frequency", f"{result.threat_event_frequency:.2f}", "Expected events per year"),
        ("Vulnerability", f"{result.vulnerability:.1%}", "Probability an event causes loss"),
        ("Loss Event Frequency", f"{result.loss_event_frequency:.2f}", "Expected loss events per year"),
        ("Annualized Loss", money(result.annualized_loss_expectancy), "Long-run annual expectancy"),
    ],
    "expected-loss",
)

st.markdown("### Calculation trace")
st.code(
    f"Loss Event Frequency = {result.threat_event_frequency:.2f} × {result.vulnerability:.1%} = {result.loss_event_frequency:.2f}\n"
    f"Loss Magnitude = {money(result.primary_loss)} + {money(result.expected_secondary_loss)} = {money(result.loss_magnitude)}\n"
    f"Annualized Loss Expectancy = {result.loss_event_frequency:.2f} × {money(result.loss_magnitude)} = {money(result.annualized_loss_expectancy)}"
)
