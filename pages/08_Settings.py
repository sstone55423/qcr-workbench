import streamlit as st

from qcr_core.themes import THEMES, get_theme, theme_names
from ui_shared import configure_page, render_copyright

configure_page("Settings")

st.caption("Choose a palette. Selecting a theme automatically activates its light or dark mode.")


def select_theme(name: str) -> None:
    theme = THEMES[name]
    if theme.mode == "dark":
        st.session_state.dark_theme = name
        st.session_state.dark_mode = True
    else:
        st.session_state.light_theme = name
        st.session_state.dark_mode = False


light_names = theme_names("light")
dark_names = theme_names("dark")
all_names = light_names + dark_names
columns = st.columns(8, gap="small")

for column, name in zip(columns, all_names):
    theme = THEMES[name]
    selected = name == (st.session_state.dark_theme if theme.mode == "dark" else st.session_state.light_theme)
    with column:
        st.markdown(
            f'<div title="{name}" style="height:2.1rem;border-radius:.4rem;border:2px solid {theme.primary if selected else theme.border};'
            f'background:linear-gradient(135deg,{theme.background} 0 48%,{theme.primary} 48% 74%,{theme.accent} 74%);"></div>',
            unsafe_allow_html=True,
        )
        st.button(
            name,
            key=f"theme-{name}",
            use_container_width=True,
            type="primary" if selected else "secondary",
            on_click=select_theme,
            args=(name,),
        )

active = get_theme(
    st.session_state.get("dark_mode", False),
    st.session_state.light_theme,
    st.session_state.dark_theme,
)
st.caption(f"Active: **{active.name}** · {active.mode.title()} mode · Saved for this browser session")
render_copyright()
