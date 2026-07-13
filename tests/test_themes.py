from qcr_core.themes import THEMES, get_theme, theme_names


def test_has_four_themes_per_mode():
    assert len(THEMES) == 8
    assert len(theme_names("light")) == 4
    assert len(theme_names("dark")) == 4


def test_theme_selection_respects_mode():
    assert get_theme(False, "Clinical Mint", "Graphite").name == "Clinical Mint"
    assert get_theme(True, "Clinical Mint", "Graphite").name == "Graphite"
