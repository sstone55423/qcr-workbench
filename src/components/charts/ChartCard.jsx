import React from 'react';

export default function ChartCard({ title, subtitle = null, children }) {
  return (
    <div className="border border-border rounded-xl p-5 bg-card">
      <h3 className="text-sm font-medium">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}
