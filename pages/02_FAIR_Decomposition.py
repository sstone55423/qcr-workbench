import pandas as pd
import streamlit as st

from qcr_core.fair import decomposition_rows, expected_loss
from ui_shared import active_model, configure_page, metric_card_row, money, selected_scenario

configure_page("FAIR Decomposition")
scenario = selected_scenario()
model = active_model(scenario)
result = expected_loss(model)

left, right = st.columns(2)
with left:
    st.markdown("### Frequency")
    st.write("Threat Event Frequency × Vulnerability = Loss Event Frequency")
    metric_card_row(
        [("Loss Event Frequency", f"{result.loss_event_frequency:.2f}", "Expected loss events per year")],
        "fair-frequency",
    )
with right:
    st.markdown("### Magnitude")
    st.write("Primary Loss + Expected Secondary Loss = Loss Magnitude")
    metric_card_row(
        [("Loss Magnitude", money(result.loss_magnitude), "Expected loss per event")],
        "fair-magnitude",
    )

st.markdown("### Factor estimates")
st.dataframe(pd.DataFrame(decomposition_rows(model)), use_container_width=True, hide_index=True)
