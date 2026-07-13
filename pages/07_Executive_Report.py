import streamlit as st
import plotly.graph_objects as go

from qcr_core.fair import expected_loss
from qcr_core.reporting import executive_summary
from ui_shared import active_model, configure_page, guidance_alert, selected_scenario, style_plotly

configure_page("Executive Report")
scenario = selected_scenario()
expected = expected_loss(active_model(scenario))
simulation = st.session_state.get("simulation")
treatment_data = st.session_state.get("treatment")
treatment = treatment_data[1] if treatment_data else None
report = executive_summary(scenario, expected, simulation, treatment)

# Streamlit Markdown treats pairs of dollar signs as LaTeX delimiters. Escape
# them for display while keeping ordinary dollar signs in the downloaded file.
if simulation:
    report_column, chart_column = st.columns([3, 2], gap="large")
    with report_column:
        st.markdown(report.replace("$", r"\$"))
    with chart_column:
        labels = ["ALE", "Mean", "Median", "P90", "P95", "P99"]
        values = [
            expected.annualized_loss_expectancy,
            simulation.mean,
            simulation.median,
            simulation.percentile_90,
            simulation.percentile_95,
            simulation.percentile_99,
        ]
        figure = go.Figure(
            go.Bar(
                x=labels,
                y=values,
                marker_color=["#4C78A8", "#72B7B2", "#54A24B", "#F2CF5B", "#E45756", "#B279A2"],
                text=[f"${value:,.0f}" for value in values],
                textposition="outside",
                hovertemplate="%{x}: $%{y:,.0f}<extra></extra>",
            )
        )
        figure.add_hline(
            y=simulation.percentile_95,
            line_color="#E00000",
            line_width=3,
            line_dash="dash",
            annotation_text=f"95th percentile: ${simulation.percentile_95:,.0f}",
            annotation_position="top left",
        )
        figure.update_layout(
            title="Annual Loss Measures",
            yaxis_title="Annual loss",
            yaxis_tickprefix="$",
            yaxis_tickformat=",.0f",
            showlegend=False,
            height=480,
            margin=dict(l=20, r=20, t=70, b=20),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        style_plotly(figure)
        st.plotly_chart(figure, use_container_width=True)
        st.caption("The red dashed line marks the 95th-percentile annual loss threshold.")
else:
    st.markdown(report.replace("$", r"\$"))
st.download_button("Download Markdown report", report, file_name=f"{scenario.id}-risk-report.md", mime="text/markdown")
if simulation is None:
    guidance_alert("Tail-risk analysis not yet included", "Run the Monte Carlo page to add percentile metrics to this report.", "report-simulation-guidance")
if treatment is None:
    guidance_alert("Treatment analysis not yet included", "Complete Treatment Comparison to add control economics.", "report-treatment-guidance")
