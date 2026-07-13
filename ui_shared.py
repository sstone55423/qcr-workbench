"""Small Streamlit helpers; quantitative logic belongs in qcr_core."""

from __future__ import annotations

import streamlit as st
import streamlit_shadcn_ui as shadcn

from qcr_core.models import FairModel, ThreePointEstimate
from qcr_core.scenarios import load_scenarios
from qcr_core.themes import get_theme

WORKFLOW_STEPS = [
    "Scenario Scoping",
    "FAIR Decomposition",
    "Assumptions",
    "Expected Loss",
    "Monte Carlo Simulation",
    "Treatment Comparison",
    "Executive Report",
]


def apply_theme() -> None:
    """Render global theme controls and apply the selected palette."""
    # Assigning durable widget state to itself prevents Streamlit's multipage
    # widget cleanup from discarding the value during page navigation.
    st.session_state.dark_mode = st.session_state.get("dark_mode", False)
    st.session_state.setdefault("light_theme", "Arctic Blue")
    st.session_state.setdefault("dark_theme", "Midnight Blue")
    dark_mode = st.sidebar.toggle("Dark mode", key="dark_mode")
    theme = get_theme(
        dark_mode,
        st.session_state.light_theme,
        st.session_state.dark_theme,
    )
    st.sidebar.caption(f"Theme: {theme.name}")
    st.markdown(
        f"""
        <style>
        :root {{ color-scheme: {theme.mode}; }}
        .stApp, [data-testid="stAppViewContainer"] {{ background: {theme.background}; color: {theme.text}; }}
        [data-testid="stHeader"] {{ background: color-mix(in srgb, {theme.background} 88%, transparent); }}
        [data-testid="stSidebar"] {{
            background: {theme.sidebar}; border-right: 1px solid {theme.border};
            min-width: 23rem; max-width: 23rem;
        }}
        [data-testid="stSidebar"] > div:first-child {{ width: 23rem; }}
        [data-testid="stSidebar"] * {{ color: {theme.text}; }}
        [data-testid="stSidebar"] [data-baseweb="select"] * {{ font-size: .86rem; }}
        h1, h2, h3, h4, h5, h6, p, label, .stMarkdown {{ color: {theme.text}; }}
        [data-testid="stCaptionContainer"], .stCaption {{ color: {theme.muted} !important; }}
        [data-testid="stMetric"], [data-testid="stVerticalBlockBorderWrapper"] {{
            background: {theme.surface}; border-color: {theme.border} !important; border-radius: 0.65rem;
        }}
        [data-testid="stMetricValue"] {{ color: {theme.primary}; }}
        .stButton > button, .stDownloadButton > button {{
            background: {theme.primary}; color: white; border-color: {theme.primary};
        }}
        .stButton > button:hover, .stDownloadButton > button:hover {{
            background: {theme.accent}; border-color: {theme.accent}; color: white;
        }}
        [data-baseweb="select"] > div, [data-baseweb="input"] > div, [data-baseweb="base-input"],
        .stNumberInput input, .stTextInput input {{
            background: {theme.surface} !important; color: {theme.text} !important; border-color: {theme.border} !important;
        }}
        [data-testid="stDataFrame"], .stCodeBlock {{ border-color: {theme.border}; }}
        a {{ color: {theme.primary}; }}
        @media (max-width: 700px) {{
            [data-testid="stSidebar"] {{ min-width: min(23rem, 85vw); max-width: 85vw; }}
            [data-testid="stSidebar"] > div:first-child {{ width: 85vw; }}
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def configure_page(title: str) -> None:
    st.set_page_config(page_title=f"{title} | QCR Workbench", page_icon="📊", layout="wide")
    apply_theme()
    if title in WORKFLOW_STEPS:
        step = WORKFLOW_STEPS.index(title) + 1
        st.sidebar.caption(f"Workflow · Step {step} of {len(WORKFLOW_STEPS)}")
        shadcn.progress(data=round(step / len(WORKFLOW_STEPS) * 100), key=f"workflow-progress-{step}")
    st.markdown(
        "<style>.block-container { padding-top: 2rem; }</style>",
        unsafe_allow_html=True,
    )
    st.title(title)


def selected_scenario():
    scenarios = load_scenarios()
    ids = [scenario.id for scenario in scenarios]
    current = st.session_state.get("scenario_id", ids[0])
    index = ids.index(current) if current in ids else 0
    selected = st.sidebar.selectbox("Active scenario", scenarios, index=index, format_func=lambda x: x.name)
    if selected.id != st.session_state.get("scenario_id"):
        st.session_state.scenario_id = selected.id
        st.session_state.pop("fair_model", None)
        st.session_state.pop("simulation", None)
        st.session_state.pop("treatment", None)
    st.sidebar.caption("Stella Polaris Medical Components")
    shadcn.badges(
        badge_list=[("Active", "secondary"), (selected.name, "default"), (selected.owner, "outline")],
        class_name="flex gap-2 flex-wrap",
        key=f"scenario-context-{selected.id}",
    )
    return selected


def active_model(scenario) -> FairModel:
    if "fair_model" not in st.session_state:
        st.session_state.fair_model = scenario.fair
    return st.session_state.fair_model


def money(value: float) -> str:
    return f"${value:,.0f}"


def metric_card_row(items: list[tuple[str, str, str]], key_prefix: str) -> None:
    """Render a responsive row of compact Shadcn metric cards."""
    columns = st.columns(len(items), gap="small")
    for index, (column, (title, content, description)) in enumerate(zip(columns, items)):
        with column:
            shadcn.metric_card(
                title=title,
                content=content,
                description=description,
                key=f"{key_prefix}-{index}",
            )


def guidance_alert(title: str, description: str, key: str) -> None:
    """Render a compact Shadcn guidance callout."""
    shadcn.alert(title=title, description=description, key=key)


def style_plotly(figure):
    """Apply the selected workbench palette to a Plotly figure."""
    theme = get_theme(
        st.session_state.get("dark_mode", False),
        st.session_state.get("light_theme", "Arctic Blue"),
        st.session_state.get("dark_theme", "Midnight Blue"),
    )
    figure.update_layout(
        template="plotly_dark" if theme.mode == "dark" else "plotly_white",
        colorway=[theme.primary, theme.accent, theme.muted],
        font_color=theme.text,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    figure.update_xaxes(gridcolor=theme.border, zerolinecolor=theme.border)
    figure.update_yaxes(gridcolor=theme.border, zerolinecolor=theme.border)
    return figure


def render_copyright() -> None:
    """Render the application copyright footer."""
    st.markdown(
        """
        <div style="margin-top:3rem;padding-top:1rem;border-top:1px solid currentColor;opacity:.65;text-align:center;font-size:.85rem;">
            &copy; 2026 Scott Thomas Stone. All rights reserved.
        </div>
        """,
        unsafe_allow_html=True,
    )


def edit_estimate(label: str, estimate: ThreePointEstimate) -> tuple[float, float, float]:
    st.markdown(f"**{label}** · {estimate.unit}")
    input_area, _ = st.columns([1, 2])
    cols = input_area.columns(3)
    values = [estimate.minimum, estimate.most_likely, estimate.maximum]
    labels = ["Minimum", "Most likely", "Maximum"]
    edited = [cols[i].number_input(labels[i], min_value=0.0, value=float(values[i]), key=f"{label}-{labels[i]}") for i in range(3)]
    return tuple(edited)
