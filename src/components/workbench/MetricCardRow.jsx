import React from 'react';

// Row of metric cards: [{ label, value, hint? }] — the React equivalent of
// v0's shadcn metric_card row.
export default function MetricCardRow({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="border border-border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
          <p className="text-2xl font-heading font-bold tracking-tight">{item.value}</p>
          {item.hint && <p className="text-xs text-muted-foreground mt-1">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}
