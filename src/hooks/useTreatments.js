import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/localdb/store';

export default function useTreatments(scenarioId) {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    if (!scenarioId) { setTreatments([]); setLoading(false); return; }
    // Ignore results that resolve after the scenario has changed again,
    // so a slow earlier query can't overwrite the current scenario's treatments.
    let stale = false;
    setLoading(true);
    setError(null);
    db.entities.Treatment.filter({ scenario_id: scenarioId }, 'created_date')
      .then(data => { if (!stale) setTreatments(data); })
      .catch(err => { if (!stale) setError(err); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [scenarioId, version]);

  return { treatments, loading, error, reload };
}
