import streamlit as st

from ui_shared import configure_page, selected_scenario

configure_page("Scenario Scoping")
scenario = selected_scenario()
st.subheader(scenario.name)
st.write(scenario.description)

cols = st.columns(4)
fields = [
    ("Asset / service", scenario.asset),
    ("Threat actor", scenario.threat),
    ("Effect", scenario.effect),
    ("Risk owner", scenario.owner),
]
for column, (label, value) in zip(cols, fields):
    with column:
        with st.container(border=True):
            st.caption(label)
            st.markdown(f"**{value}**")

st.markdown("### FAIR-style risk statement")
st.success(f"A **{scenario.threat}** affects **{scenario.asset}**, causing **{scenario.effect.lower()}**.")
st.markdown("### Scoping assumptions")
for assumption in scenario.assumptions:
    st.write(f"- {assumption}")

st.divider()
st.page_link("pages/02_FAIR_Decomposition.py", label="FAIR Decomposition", icon="➡️")
