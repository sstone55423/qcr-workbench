import React from 'react';
import { useTheme, COLOR_THEMES } from '@/lib/ThemeContext';
import { Check, Moon } from 'lucide-react';

export default function ThemePicker() {
  const { colorTheme, setColorTheme } = useTheme();

  return (
    <div className="flex flex-wrap gap-4">
      {COLOR_THEMES.map(t => {
        const selected = colorTheme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setColorTheme(t.id)}
            className="flex flex-col items-center gap-1.5 group"
            title={t.name}
          >
            <span
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-shadow ${
                selected ? 'ring-2 ring-ring ring-offset-2 ring-offset-background border-transparent' : 'border-border group-hover:ring-1 group-hover:ring-ring'
              }`}
              style={{ background: `linear-gradient(135deg, ${t.colors[0]} 50%, ${t.colors[1]} 50%)` }}
            >
              {selected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
            </span>
            <span className={`text-xs flex items-center gap-1 ${selected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {t.name}
              {t.dark && <Moon className="w-3 h-3 opacity-60" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}