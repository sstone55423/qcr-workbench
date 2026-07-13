import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const COLOR_THEMES = [
  { id: 'theme-scholar', name: 'Scholar', colors: ['#2e4a77', '#8296b3'] },
  { id: 'theme-harbor', name: 'Harbor', colors: ['#1d6a7a', '#4fb3c4'] },
  { id: 'theme-indigo', name: 'Indigo', colors: ['#4338ca', '#818cf8'] },
  { id: 'theme-violet', name: 'Violet', colors: ['#7c3aed', '#d946ef'] },
  { id: 'theme-neon', name: 'Neon', colors: ['#39ff14', '#a020f0'] },
  // Dark-optimized: deep custom backgrounds + high-separability chart palettes.
  { id: 'theme-midnight', name: 'Midnight', colors: ['#22c3e6', '#7c5cff'], dark: true },
  { id: 'theme-ember', name: 'Ember', colors: ['#f5892e', '#f0466b'], dark: true },
  { id: 'theme-aurora', name: 'Aurora', colors: ['#2ee6a0', '#8b5cf6'], dark: true },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('qcr-theme') || 'light');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('qcr-color-theme') || 'theme-scholar');

  useEffect(() => {
    localStorage.setItem('qcr-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('qcr-color-theme', colorTheme);
    const el = document.documentElement;
    COLOR_THEMES.forEach(t => el.classList.remove(t.id));
    if (colorTheme !== 'theme-scholar') el.classList.add(colorTheme);
  }, [colorTheme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);