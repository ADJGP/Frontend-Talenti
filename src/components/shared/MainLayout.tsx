import { useJobStore } from '../../store/useJobStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { JobDashboard } from '../jobs/JobDashboard';
import {
  ApplicationsView,
  DashboardInsightsView,
  ProfileView,
  SettingsView,
} from './SecondaryViews';
import { CommandPalette } from './CommandPalette';
import { ApplyModal } from '../jobs/ApplyModal';
import { ShortcutsModal } from './ShortcutsModal';
import { useJobs } from '../../hooks/useJobs';
import { useTheme } from '../../hooks/useTheme';

export function MainLayout() {
  useTheme();
  const activeNav = useJobStore((state) => state.activeNav);
  const selectedJobId = useJobStore((state) => state.selectedJobId);
  const { data } = useJobs();

  // Find active job for the apply modal
  const activeJob = data?.jobs.find((j) => j.id === selectedJobId) || null;

  const renderContent = () => {
    switch (activeNav) {
      case 'applications':
        return <ApplicationsView />;
      case 'saved':
        // Renders the split-view dashboard pre-filtered to saved jobs
        return <JobDashboard />;
      case 'dashboard':
        return <DashboardInsightsView />;
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
