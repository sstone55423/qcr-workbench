import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Menu, ShieldAlert } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import WelcomeNotice from '@/components/WelcomeNotice';
import UnloadGuard from '@/components/UnloadGuard';
import AutoLock from '@/components/AutoLock';
import TutorialGuide from '@/components/tutorial/TutorialGuide';
import WebMcpBridge from '@/components/WebMcpBridge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/I18nContext';

export default function AppLayout() {
  const { t } = useI18n();
  // On mobile the sidebar is an off-canvas drawer; on md+ it is a static column
  // and this state is inert (the drawer classes are md:hidden / md:static).
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar — hidden on md+ where the sidebar is always visible. */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-2 px-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" aria-label={t('sidebar.openMenu')} onClick={() => setMobileOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
          <span className="font-heading font-bold text-base tracking-tight truncate">QCR Workbench</span>
        </Link>
      </header>

      {/* Backdrop behind the open drawer (mobile only). */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* pt-14 clears the fixed mobile top bar; removed at md+. */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
      <WelcomeNotice />
      <UnloadGuard />
      <AutoLock />
      <TutorialGuide />
      <WebMcpBridge />
    </div>
  );
}
