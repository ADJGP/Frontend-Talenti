import {
  Briefcase,
  LayoutDashboard,
  FileCheck,
  Bookmark,
  User,
  Settings,
  Keyboard,
  Sparkles,
  Search,
} from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useTranslation } from '../../i18n';
import { cn } from '../../utils';

export function Sidebar() {
  const { t } = useTranslation();
  const activeNav = useJobStore((state) => state.activeNav);
  const setActiveNav = useJobStore((state) => state.setActiveNav);
  const setShortcutsModalOpen = useJobStore((state) => state.setShortcutsModalOpen);
  const setCommandPaletteOpen = useJobStore((state) => state.setCommandPaletteOpen);
  const savedJobIds = useJobStore((state) => state.savedJobIds);
  const appliedJobs = useJobStore((state) => state.appliedJobs);
  const appliedCount = Object.keys(appliedJobs).length;

  const navItems = [
    {
      id: 'jobs',
      label: t.navJobs,
      icon: Briefcase,
      badge: '8',
    },
    {
      id: 'applications',
      label: t.navApplications,
      icon: FileCheck,
      badge: appliedCount > 0 ? String(appliedCount) : undefined,
    },
    {
      id: 'saved',
      label: t.navSaved,
      icon: Bookmark,
      badge: savedJobIds.length > 0 ? String(savedJobIds.length) : undefined,
    },
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'profile',
      label: t.navProfile,
      icon: User,
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: Settings,
    },
  ];


  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-16 lg:w-18 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-4 z-20 select-none">
      {/* Brand Icon */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={() => setActiveNav('jobs')}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
          title="JobSplit"
        >
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
          <span className="sr-only">JobSplit</span>
        </button>

        {/* Quick Search Shortcut Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
          title="Quick Search (Cmd+K)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Primary Navigation Icons */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={cn(
                  'relative group flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                )}
                title={item.label}
              >
                <Icon className={cn('h-5 w-5 transition-transform group-hover:scale-110', isActive && 'stroke-[2.2]')} />

                {/* Left active marker indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
                )}

                {/* Subtle Counter Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip hint on hover */}
                <div className="pointer-events-none absolute left-full ml-3 hidden rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg group-hover:block dark:bg-slate-100 dark:text-slate-900 z-50 whitespace-nowrap">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Shortcuts */}
      <div className="flex flex-col items-center gap-3">
        {/* Keyboard Help Trigger */}
        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        {/* User Avatar */}
        <div className="relative group cursor-pointer" onClick={() => setActiveNav('profile')}>
          <div className="h-9 w-9 rounded-full ring-2 ring-indigo-500/30 overflow-hidden bg-slate-200 dark:bg-slate-700">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
              alt="Alex Vance"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </div>
      </div>
    </aside>
  );
}
