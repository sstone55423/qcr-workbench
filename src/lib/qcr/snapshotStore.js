// Point-in-time snapshots of a project's exposure, for the trend view.
// A snapshot deliberately PERSISTS computed numbers (per-scenario ALE, total,
// simulated P95 where one exists): it is a historical record of what the
// model said at that moment, which is not recomputable after estimates
// change. This is the documented exception to the "never persist
// recomputables" rule — the point of a snapshot is that it doesn't change.
import { db } from '@/lib/localdb/store';
import { logAudit } from '@/lib/auditLog';
import { expectedLoss } from '@/lib/qcr/fair';

export async function takeSnapshot(project, scenarios) {
  const entries = scenarios.map((s) => ({
    scenario_id: s.id,
    name: s.name,
    ale: expectedLoss(s.fair).ale,
    p95: s.simulation?.summary?.percentile_95 ?? null,
  }));
  const record = await db.entities.Snapshot.create({
    project_id: project.id,
    taken_at: new Date().toISOString(),
    total_ale: entries.reduce((sum, e) => sum + e.ale, 0),
    scenario_count: entries.length,
    entries,
  });
  logAudit(project.id, 'report', 'auditMsg.snapshotTaken', { count: entries.length });
  return record;
}

export async function deleteSnapshot(snapshot) {
  await db.entities.Snapshot.delete(snapshot.id);
  logAudit(snapshot.project_id, 'report', 'auditMsg.snapshotDeleted', {
    date: new Date(snapshot.taken_at).toLocaleDateString(),
  });
}

// Oldest first — chart-ready order.
export async function listSnapshots(projectId) {
  const records = await db.entities.Snapshot.filter({ project_id: projectId });
  return records.sort((a, b) => a.taken_at.localeCompare(b.taken_at));
}
