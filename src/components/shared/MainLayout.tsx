import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useJobs } from '../../hooks/useJobs';
import { useMyApplications } from '../../hooks/useApply';
import { useTheme } from '../../hooks/useTheme';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { JobDashboard } from '../jobs/JobDashboard';
import {
  ApplicationsView,
  DashboardInsightsView,
  ProfileView,
  SettingsView,
} from './SecondaryViews';
import { RecruiterView } from '../recruiter/RecruiterView';
import { AuthScreen } from '../auth/AuthScreen';
import { CommandPalette } from './CommandPalette';
import { ApplyModal } from '../jobs/ApplyModal';
import { ShortcutsModal } from './ShortcutsModal';

/** Views that need a Talenti session (the job feed stays public). */
const PRIVATE_VIEWS = new Set(['applications', 'profile', 'dashboard', 'company']);

export function MainLayout() {
  useTheme();
  const activeNav = useJobStore((state) => state.activeNav);
  const selectedJobId = useJobStore((state) => state.selectedJobId);
  const isAuthOpen = useJobStore((state) => state.isAuthOpen);
  const setAuthOpen = useJobStore((state) => state.setAuthOpen);

  const authStatus = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  const { data } = useJobs();

  // Restore the session once on boot (refresh token → new access token).
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Keep the "already applied" markers in sync with the backend.
  useMyApplications({enabled: authStatus === 'authenticated'});

  // Close the auth screen right after a successful sign-in.
  useEffect(() => {
    if (authStatus === 'authenticated' && isAuthOpen) setAuthOpen(false);
  }, [authStatus, isAuthOpen, setAuthOpen]);

  // Find active job for the apply modal
  const activeJob = data?.jobs.find((j) => j.id === selectedJobId) || null;

  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Auth gate: explicit request, or a private view while anonymous.
  const requiresAuth = isAuthOpen || PRIVATE_VIEWS.has(activeNav);
  if (requiresAuth && authStatus !== 'authenticated') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <main className="flex-1 min-h-0">
          <AuthScreen />
        </main>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeNav) {
      case 'applications':
        return <ApplicationsView />;
      case 'saved':
        // Renders the split-view dashboard pre-filtered to saved jobs
        return <JobDashboard />;
      case 'dashboard':
        return <DashboardInsightsView />;
      case 'company':
        return <RecruiterView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'jobs':
      default:
        return <JobDashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Slim Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Route/View Container */}
        <main className="flex-1 min-h-0 overflow-hidden relative">
          {renderContent()}
        </main>
      </div>

      {/* Global Modals & Command Overlays */}
      <CommandPalette />
      <ApplyModal job={activeJob} />
      <ShortcutsModal />
    </div>
  );
}
