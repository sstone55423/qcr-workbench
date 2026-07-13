"""Theme definitions kept independent from Streamlit rendering."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ColorTheme:
    name: str
    mode: str
    background: str
    surface: str
    sidebar: str
    text: str
    muted: str
    primary: str
    accent: str
    border: str


THEMES: dict[str, ColorTheme] = {
    "Arctic Blue": ColorTheme("Arctic Blue", "light", "#F6F9FC", "#FFFFFF", "#EAF2F8", "#17202A", "#52616B", "#1565C0", "#00ACC1", "#CFD8DC"),
    "Clinical Mint": ColorTheme("Clinical Mint", "light", "#F5FBF8", "#FFFFFF", "#E3F3EC", "#17352A", "#587068", "#087F5B", "#2F9E44", "#C8DED4"),
    "Warm Sand": ColorTheme("Warm Sand", "light", "#FCF8F0", "#FFFFFF", "#F3E8D3", "#3B3027", "#746457", "#B45309", "#D97706", "#E5D5BA"),
    "Lavender Mist": ColorTheme("Lavender Mist", "light", "#FAF8FF", "#FFFFFF", "#EEE9FA", "#302A43", "#6D647C", "#6D4BC3", "#9C5DE5", "#DCD4ED"),
    "Midnight Blue": ColorTheme("Midnight Blue", "dark", "#0B1220", "#131D2E", "#101A2A", "#EDF4FF", "#9AABC2", "#5EA1FF", "#22D3EE", "#293952"),
    "Graphite": ColorTheme("Graphite", "dark", "#151719", "#202326", "#1B1E21", "#F1F3F5", "#ADB5BD", "#74C0FC", "#CED4DA", "#3B4045"),
    "Forest Night": ColorTheme("Forest Night", "dark", "#0D1914", "#14251D", "#102019", "#E9F5EE", "#9DB6A7", "#4FD1A1", "#A3E635", "#294438"),
    "Aubergine": ColorTheme("Aubergine", "dark", "#1B1020", "#28172E", "#211327", "#FAF0FC", "#C4A8C9", "#D88BFF", "#FF7EB6", "#4A2C52"),
}


def theme_names(mode: str) -> list[str]:
    return [name for name, theme in THEMES.items() if theme.mode == mode]


def get_theme(dark_mode: bool, light_name: str, dark_name: str) -> ColorTheme:
    fallback = "Midnight Blue" if dark_mode else "Arctic Blue"
    selected = dark_name if dark_mode else light_name
    theme = THEMES.get(selected, THEMES[fallback])
    return theme if theme.mode == ("dark" if dark_mode else "light") else THEMES[fallback]

