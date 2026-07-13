import streamlit as st

from qcr_core.models import FairModel, ThreePointEstimate
from ui_shared import active_model, configure_page, edit_estimate, guidance_alert, selected_scenario

configure_page("Assumptions")
scenario = selected_scenario()
model = active_model(scenario)
guidance_alert(
    "Calibrate uncertainty",
    "Adjust bounded three-point estimates. Changes persist across pages for this browser session.",
    "assumption-guidance",
)

with st.form("assumptions"):
    tef = edit_estimate("Threat Event Frequency", model.threat_event_frequency)
    vulnerability = edit_estimate("Vulnerability", model.vulnerability)
    primary = edit_estimate("Primary Loss", model.primary_loss)
    secondary = edit_estimate("Secondary Loss", model.secondary_loss)
    secondary_probability = edit_estimate("Secondary Loss Probability", model.secondary_loss_probability)
    submitted = st.form_submit_button("Apply assumptions", type="primary")

if submitted:
    try:
        st.session_state.fair_model = FairModel(
            ThreePointEstimate(*tef, unit=model.threat_event_frequency.unit),
            ThreePointEstimate(*vulnerability, unit=model.vulnerability.unit),
            ThreePointEstimate(*primary, unit=model.primary_loss.unit),
            ThreePointEstimate(*secondary, unit=model.secondary_loss.unit),
            ThreePointEstimate(*secondary_probability, unit=model.secondary_loss_probability.unit),
        )
        st.session_state.pop("simulation", None)
        st.session_state.pop("treatment", None)
        st.success("Assumptions applied.")
    except ValueError as exc:
        st.error(str(exc))

if st.button("Reset to example values"):
    st.session_state.fair_model = scenario.fair
    st.session_state.pop("simulation", None)
    st.session_state.pop("treatment", None)
    st.rerun()
