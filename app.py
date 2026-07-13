import streamlit as st

from qcr_core.scenarios import load_scenarios
from ui_shared import apply_theme, render_copyright

st.set_page_config(page_title="QCR Workbench", page_icon="📊", layout="wide")
apply_theme()
st.title("Quantitative Cyber Risk Workbench")
st.subheader("Stella Polaris Medical Components")
st.write("Scope cyber-risk scenarios, decompose them using FAIR, quantify uncertainty, and compare risk treatments.")

scenarios = load_scenarios()
cols = st.columns(3)
for index, scenario in enumerate(scenarios):
    with cols[index % 3]:
        with st.container(border=True):
            st.markdown(f"### {scenario.name}")
            st.write(scenario.description)
            st.caption(f"Owner: {scenario.owner}")
            if st.button("Analyze scenario", key=f"analyze-{scenario.id}", use_container_width=True):
                st.session_state.scenario_id = scenario.id
                st.session_state.pop("fair_model", None)
                st.session_state.pop("simulation", None)
                st.session_state.pop("treatment", None)
                st.switch_page("pages/01_Scenario_Scoping.py")

st.info("Choose **Analyze scenario** on any card. You can change the active scenario later from the sidebar. Example values are illustrative and should be validated with organizational data.")
render_copyright()
