import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import WelcomeNotice from '@/components/WelcomeNotice';
import UnloadGuard from '@/components/UnloadGuard';
import AutoLock from '@/components/AutoLock';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <WelcomeNotice />
      <UnloadGuard />
      <AutoLock />
    </div>
  );
}