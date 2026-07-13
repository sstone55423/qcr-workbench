import pandas as pd
import plotly.express as px
import streamlit as st

from qcr_core.simulation import exceedance_curve, simulate_annual_loss
from ui_shared import active_model, configure_page, metric_card_row, money, selected_scenario, style_plotly

configure_page("Monte Carlo Simulation")
scenario = selected_scenario()
model = active_model(scenario)

iterations = st.sidebar.select_slider("Iterations", options=[1_000, 5_000, 10_000, 20_000, 50_000], value=20_000)
seed = st.sidebar.number_input("Random seed", min_value=0, value=42)
if st.button("Run simulation", type="primary") or "simulation" not in st.session_state:
    with st.spinner("Simulating annual losses..."):
        st.session_state.simulation = simulate_annual_loss(model, iterations, int(seed))

result = st.session_state.simulation
metric_card_row(
    [
        ("Mean Annual Loss", money(result.mean), "Average across simulations"),
        ("Median Annual Loss", money(result.median), "50th-percentile outcome"),
        ("95th Percentile", money(result.percentile_95), "5% of years are higher"),
        ("No-loss Probability", f"{result.probability_of_zero_loss:.1%}", "Years with zero modeled loss"),
    ],
    "monte-carlo",
)

losses = pd.DataFrame({"Annual loss": result.annual_losses})
histogram = px.histogram(losses, x="Annual loss", nbins=60, title="Annual loss distribution")
histogram.update_layout(height=290, margin=dict(l=20, r=20, t=45, b=0))
style_plotly(histogram)
st.plotly_chart(histogram, use_container_width=True)
thresholds, probabilities = exceedance_curve(result)
curve = pd.DataFrame({"Loss threshold": thresholds, "Probability of exceedance": probabilities})
exceedance = px.line(curve, x="Loss threshold", y="Probability of exceedance", title="Loss exceedance curve")
exceedance.update_layout(height=330, margin=dict(l=20, r=20, t=40, b=10))
style_plotly(exceedance)
st.plotly_chart(exceedance, use_container_width=True)
