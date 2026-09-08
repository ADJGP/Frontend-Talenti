import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../i18n';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 p-0.5 shadow-2xs">
      <button
        onClick={() => setTheme('light')}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100 font-semibold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title={t.themeLight}
        aria-label={t.themeLight}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100 font-semibold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title={t.themeDark}
        aria-label={t.themeDark}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer ${
          theme === 'system'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100 font-semibold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title={t.themeSystem}
        aria-label={t.themeSystem}
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
