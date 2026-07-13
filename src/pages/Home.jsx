import React, { useState, useEffect } from 'react';
import { useProject } from '@/lib/ProjectContext';
import { useI18n } from '@/lib/I18nContext';
import { db } from '@/lib/localdb/store';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Trash2, Pencil, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function Home() {
  const { projects, selectProject, loadProjects, loading } = useProject();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [scenarioCounts, setScenarioCounts] = useState({});

  useEffect(() => {
    let stale = false;
    db.entities.Scenario.list().then(all => {
      if (stale) return;
      const counts = {};
      for (const s of all) counts[s.project_id] = (counts[s.project_id] || 0) + 1;
      setScenarioCounts(counts);
    }).catch(() => {});
    return () => { stale = true; };
  }, [projects]);

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const created = await db.entities.Project.create({ name: name.trim(), description: description.trim() });
      await loadProjects();
      selectProject(created);
      setShowCreate(false);
      setName('');
      setDescription('');
      navigate('/scenarios');
    } catch (err) {
      toast({ title: t('home.createFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!name.trim() || !editProject || saving) return;
    setSaving(true);
    try {
      await db.entities.Project.update(editProject.id, { name: name.trim(), description: description.trim() });
      await loadProjects();
      setEditProject(null);
      setName('');
      setDescription('');
    } catch (err) {
      toast({ title: t('home.saveFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await db.entities.Treatment.deleteMany({ project_id: deleteTarget.id });
      await db.entities.Scenario.deleteMany({ project_id: deleteTarget.id });
      await db.entities.AuditEvent.deleteMany({ project_id: deleteTarget.id });
      await db.entities.Project.delete(deleteTarget.id);
      await loadProjects();
    } catch (err) {
      toast({ title: t('home.deleteFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const openProject = (p) => {
    selectProject(p);
    navigate('/scenarios');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">{t('home.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('home.subtitle')}</p>
        </div>
        <Button onClick={() => { setName(''); setDescription(''); setShowCreate(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> {t('home.newProject')}
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-xl">
          <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-medium mb-2">{t('home.noProjectsYet')}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t('home.noProjectsDesc')}</p>
          <Button onClick={() => { setName(''); setDescription(''); setShowCreate(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> {t('home.createProject')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <div
              key={p.id}
              className="group border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-xs transition-all cursor-pointer"
              onClick={() => openProject(p)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <h3 className="font-medium truncate">{p.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setName(p.name); setDescription(p.description || ''); setEditProject(p); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {p.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{t('home.scenariosCount', { count: scenarioCounts[p.id] || 0 })}</span>
                <span>{new Date(p.created_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate || !!editProject} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditProject(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProject ? t('home.editProject') : t('home.newProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('common.name')}</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('home.namePlaceholder')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('common.description')}</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('home.descPlaceholder')} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditProject(null); }}>{t('common.cancel')}</Button>
            <Button onClick={editProject ? handleEdit : handleCreate} disabled={!name.trim() || saving}>
              {saving ? t('common.saving') : (editProject ? t('common.save') : t('common.create'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('home.deleteTitle', { name: deleteTarget?.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('home.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
