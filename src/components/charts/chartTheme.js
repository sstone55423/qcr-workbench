// Shared Recharts styling that follows the active color theme via CSS vars.
export const AXIS_PROPS = {
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 },
  stroke: 'hsl(var(--border))',
};

export const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
};
