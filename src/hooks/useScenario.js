import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/localdb/store';

export default function useScenario(scenarioId) {
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    if (!scenarioId) { setScenario(null); setLoading(false); return; }
    // Ignore results that resolve after the route has changed again,
    // so a slow earlier query can't overwrite the current scenario.
    let stale = false;
    setLoading(true);
    setError(null);
    db.entities.Scenario.get(scenarioId)
      .then(data => { if (!stale) setScenario(data); })
      .catch(err => { if (!stale) setError(err); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [scenarioId, version]);

  return { scenario, loading, error, reload };
}
