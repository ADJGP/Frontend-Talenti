import { Search, Sparkles, Command, Bookmark, Keyboard, LogIn } from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '../../i18n';
import { Badge } from '../ui/badge';

export function Navbar() {
  const { t } = useTranslation();
  const authStatus = useAuthStore((state) => state.status);
  const setCommandPaletteOpen = useJobStore((state) => state.setCommandPaletteOpen);
  const setShortcutsModalOpen = useJobStore((state) => state.setShortcutsModalOpen);
  const savedJobIds = useJobStore((state) => state.savedJobIds);
  const filters = useJobStore((state) => state.filters);
  const setFilters = useJobStore((state) => state.setFilters);
  const activeNav = useJobStore((state) => state.activeNav);
  const setActiveNav = useJobStore((state) => state.setActiveNav);

  const getPageTitle = () => {
    switch (activeNav) {
      case 'applications':
        return t.pageTitleApplications;
      case 'saved':
        return t.pageTitleSaved;
      case 'dashboard':
        return t.pageTitleDashboard;
      case 'profile':
        return t.pageTitleProfile;
      case 'settings':
        return t.pageTitleSettings;
      default:
        return t.pageTitleJobs;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-6 glass-header">
      {/* Left: Mobile Brand & Context Title */}
      <div className="flex items-center gap-3">
        <div className="flex md:hidden items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
            Talenti
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          <span className="text-slate-400 dark:text-slate-500 font-normal">{t.platform}</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            {getPageTitle()}
            {activeNav === 'jobs' && (
              <Badge variant="indigo" className="ml-1 text-[11px] py-0">
                {t.splitViewActive}
              </Badge>
            )}
          </span>
        </div>
      </div>

      {/* Middle: Global Cmd+K Search trigger */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="group flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 px-3 text-xs text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-slate-500 dark:text-slate-400">{t.searchBarPlaceholder}</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Actions, Language Switcher & Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Keyboard hints badge */}
        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="hidden xl:flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Press ? for keyboard controls"
        >
          <Keyboard className="h-3.5 w-3.5 text-indigo-500" />
          <span className="font-mono text-[11px] font-semibold">J / K / A</span>
          <span className="text-slate-400">{t.keysEnabled}</span>
        </button>

        {/* Quick Saved filter toggle */}
        <button
          onClick={() => {
            if (activeNav !== 'jobs') setActiveNav('jobs');
            setFilters({ onlySaved: !filters.onlySaved });
          }}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all ${
            filters.onlySaved
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
          title={t.savedPill}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.savedPill}</span>
          {savedJobIds.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filters.onlySaved
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {savedJobIds.length}
            </span>
          )}
        </button>

        {/* Sign-in CTA while anonymous */}
        {authStatus !== 'authenticated' && (
          <button
            onClick={() => setActiveNav('profile')}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.authSignIn}</span>
          </button>
        )}

        {/* Language Switcher (ES / EN) */}
        <LanguageSwitcher />

        {/* Dark/Light Mode */}
        <ThemeToggle />
      </div>
    </header>
  );
}

