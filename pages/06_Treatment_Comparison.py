import pandas as pd
import streamlit as st

from qcr_core.models import Treatment
from qcr_core.treatments import compare_treatment
from ui_shared import active_model, configure_page, metric_card_row, money, selected_scenario

configure_page("Treatment Comparison")
scenario = selected_scenario()
model = active_model(scenario)

with st.form("treatment_form"):
    name = st.text_input("Treatment name", "Layered preventive and recovery controls")
    cost = st.number_input("Annual treatment cost (USD)", min_value=0.0, value=150000.0, step=10000.0)
    st.caption("Estimated proportional reduction in each FAIR factor")
    cols = st.columns(4)
    frequency = cols[0].slider("Threat frequency", 0, 100, 15) / 100
    vulnerability = cols[1].slider("Vulnerability", 0, 100, 35) / 100
    primary = cols[2].slider("Primary loss", 0, 100, 20) / 100
    secondary = cols[3].slider("Secondary loss", 0, 100, 10) / 100
    submitted = st.form_submit_button("Compare treatment", type="primary")

if submitted or "treatment" not in st.session_state:
    treatment = Treatment(name, cost, frequency, vulnerability, primary, secondary)
    st.session_state.treatment = (treatment, compare_treatment(model, treatment))

treatment, result = st.session_state.treatment
metric_card_row(
    [
        ("Baseline ALE", money(result.baseline_ale), "Before treatment"),
        ("Residual ALE", money(result.residual_ale), "After treatment"),
        ("Risk Reduction", money(result.risk_reduction), "Expected annual reduction"),
        ("Net Benefit", money(result.net_benefit), "Reduction less control cost"),
    ],
    "treatment-comparison",
)

data = pd.DataFrame({"Position": ["Baseline risk", "Residual risk", "Treatment cost"], "Annual amount": [result.baseline_ale, result.residual_ale, result.annual_cost]})
st.bar_chart(data, x="Position", y="Annual amount")
if result.return_on_control is not None:
    st.write(f"Return on control: **{result.return_on_control:.1%}**")
