import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import useScenario from '@/hooks/useScenario';

export default function WorkbenchLayout() {
  const { scenarioId } = useParams();
  const { scenario, loading, reload } = useScenario(scenarioId);
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!scenario) return <div className="p-8 text-muted-foreground">Scenario not found.</div>;
  return <Outlet context={{ scenario, reload }} />;
}
