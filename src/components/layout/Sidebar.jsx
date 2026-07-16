import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useMatch } from 'react-router-dom';
import { useProject } from '@/lib/ProjectContext';
import { useTheme } from '@/lib/ThemeContext';
import { useVault } from '@/lib/VaultContext';
import { useI18n } from '@/lib/I18nContext';
import { LANGUAGES } from '@/lib/i18n';
import useScenarios from '@/hooks/useScenarios';
import {
  ShieldAlert, Database, Settings, HelpCircle, Sun, Moon, ChevronDown, Plus,
  FolderOpen, PanelLeftClose, PanelLeft, Lock, ClipboardList, Languages, Crosshair, FolderKanban, ChartPie
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import QuickBackup from '@/components/backup/QuickBackup';
import ExitButton from '@/components/ExitButton';

// labelKey resolves through i18n at render time (see t() calls below).
const navSections = [
  { labelKey: 'nav.scenarios', icon: FolderKanban, path: '/scenarios' },
  { labelKey: 'nav.portfolio', icon: ChartPie, path: '/portfolio' },
  { labelKey: 'nav.auditLog', icon: ClipboardList, path: '/audit-log' },
  { labelKey: 'nav.settings', icon: Settings, path: '/settings' },
  { labelKey: 'nav.help', icon: HelpCircle, path: '/help' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Sidebar renders in the layout route, above the :scenarioId route, so
  // useParams can't see the id — match it from the location instead.
  const scenarioId = useMatch('/scenarios/:scenarioId/*')?.params.scenarioId;
  const { projects, currentProject, selectProject } = useProject();
  const { scenarios } = useScenarios(currentProject?.id);
  const { theme, toggleTheme } = useTheme();
  const { lock, currentStore } = useVault();
  const { t, language, setLanguage } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  // Cycle to the next language, wrapping from the last back to the first.
  const cycleLanguage = () => {
    const idx = LANGUAGES.findIndex(l => l.code === language);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLanguage(next.code);
  };
  const currentLangLabel = LANGUAGES.find(l => l.code === language)?.label || language;

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');
  const activeScenario = scenarios.find(s => s.id === scenarioId);

  return (
    <aside className={`h-screen sticky top-0 flex flex-col bg-card border-r border-border transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 flex-1 min-w-0">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
            <span className="font-heading font-bold text-lg tracking-tight truncate">QCR Workbench</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" className="shrink-0" aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      {/* Project + scenario switchers */}
      {!collapsed && (
        <div className="p-3 border-b border-border space-y-2">
          {currentStore && (
            <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1 truncate" title={currentStore.name}>
              <Database className="w-3 h-3 shrink-0" /> {currentStore.name}
            </p>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-sm h-9 font-normal">
                <span className="truncate">{currentProject?.name || t('sidebar.noProject')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {projects.map(p => (
                <DropdownMenuItem key={p.id} onClick={() => selectProject(p)}>
                  <FolderOpen className="w-3.5 h-3.5 mr-2 opacity-50" />
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center">
                  <Plus className="w-3.5 h-3.5 mr-2 opacity-50" />
                  {t('sidebar.manageProjects')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {scenarios.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-sm h-9 font-normal">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Crosshair className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    <span className="truncate">{activeScenario?.name || t('sidebar.pickScenario')}</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {scenarios.map(s => (
                  <DropdownMenuItem key={s.id} onClick={() => navigate(`/scenarios/${s.id}/scoping`)}>
                    <span className="truncate">{s.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navSections.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive(item.path)
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t(item.labelKey)}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-0.5">
        <QuickBackup collapsed={collapsed} />
        <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={cycleLanguage} title={`${t('sidebar.idiom')} — ${currentLangLabel}`} className={collapsed ? '' : 'w-full justify-start gap-2'}>
          <Languages className="w-4 h-4" />
          {!collapsed && <span className="flex-1 text-left">{t('sidebar.idiom')}</span>}
          {!collapsed && <span className="text-xs text-muted-foreground">{currentLangLabel}</span>}
        </Button>
        <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={toggleTheme} className={collapsed ? '' : 'w-full justify-start gap-2'}>
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {!collapsed && (theme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode'))}
        </Button>
        <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={lock} className={collapsed ? '' : 'w-full justify-start gap-2'}>
          <Lock className="w-4 h-4" />
          {!collapsed && t('sidebar.lockVault')}
        </Button>
        <ExitButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
