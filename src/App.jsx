import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
// Access is controlled entirely by the local encrypted vault (VaultProvider +
// LockScreen). There is no account/auth layer — the passphrase is the gate.
import { ProjectProvider } from '@/lib/ProjectContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { VaultProvider } from '@/lib/VaultContext';
import { I18nProvider } from '@/lib/I18nContext';
import ScrollToTop from './components/ScrollToTop';
import PwaUpdatePrompt from '@/components/PwaUpdatePrompt';

import AppLayout from '@/components/layout/AppLayout';
// Pages are lazy-loaded so each route becomes its own chunk instead of one
// multi-megabyte bundle.
const Home = lazy(() => import('@/pages/Home'));
const Scenarios = lazy(() => import('@/pages/Scenarios'));
const Portfolio = lazy(() => import('@/pages/Portfolio'));
const WorkbenchLayout = lazy(() => import('@/components/workbench/WorkbenchLayout'));
const Scoping = lazy(() => import('@/pages/workbench/Scoping'));
const FairDecomposition = lazy(() => import('@/pages/workbench/FairDecomposition'));
const Assumptions = lazy(() => import('@/pages/workbench/Assumptions'));
const ExpectedLoss = lazy(() => import('@/pages/workbench/ExpectedLoss'));
const Simulation = lazy(() => import('@/pages/workbench/Simulation'));
const Treatments = lazy(() => import('@/pages/workbench/Treatments'));
const Report = lazy(() => import('@/pages/workbench/Report'));
const AuditLog = lazy(() => import('@/pages/AuditLog'));
const Settings = lazy(() => import('@/pages/Settings'));
const Help = lazy(() => import('@/pages/Help'));

const PageLoading = () => (
  <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
);

const AppRoutes = () => {
  return (
    <ThemeProvider>
      <VaultProvider>
        <I18nProvider>
        <ProjectProvider>
          <TooltipProvider delayDuration={200}>
          <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/scenarios/:scenarioId" element={<WorkbenchLayout />}>
                <Route path="scoping" element={<Scoping />} />
                <Route path="fair" element={<FairDecomposition />} />
                <Route path="assumptions" element={<Assumptions />} />
                <Route path="expected-loss" element={<ExpectedLoss />} />
                <Route path="simulation" element={<Simulation />} />
                <Route path="treatments" element={<Treatments />} />
                <Route path="report" element={<Report />} />
              </Route>
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          </Suspense>
          </TooltipProvider>
        </ProjectProvider>
        </I18nProvider>
      </VaultProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
      <Toaster />
      <PwaUpdatePrompt />
    </>
  )
}

export default App
