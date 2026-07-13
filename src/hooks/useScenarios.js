import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/localdb/store';

export default function useScenarios(projectId) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    if (!projectId) { setScenarios([]); setLoading(false); return; }
    // Ignore results that resolve after the project has changed again,
    // so a slow earlier query can't overwrite the current project's scenarios.
    let stale = false;
    setLoading(true);
    setError(null);
    db.entities.Scenario.filter({ project_id: projectId }, 'created_date')
      .then(data => { if (!stale) setScenarios(data); })
      .catch(err => { if (!stale) setError(err); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [projectId, version]);

  return { scenarios, loading, error, reload };
}
