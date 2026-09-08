import { Globe } from 'lucide-react';
import { useTranslation, type Language } from '../../i18n';
import { cn } from '../../utils';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact';
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-850 p-0.5 text-xs font-semibold',
          className
        )}
      >
        <button
          type="button"
          onClick={() => toggleLanguage('es')}
          className={cn(
            'rounded-md px-2.5 py-1 transition-all',
            language === 'es'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          Español
        </button>
        <button
          type="button"
          onClick={() => toggleLanguage('en')}
          className={cn(
            'rounded-md px-2.5 py-1 transition-all',
            language === 'en'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          English
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs shadow-2xs',
        className
      )}
    >
      <Globe className="h-3.5 w-3.5 text-slate-400" />
      <button
        type="button"
        onClick={() => toggleLanguage('es')}
        className={cn(
          'rounded px-1.5 py-0.5 font-bold transition-colors',
          language === 'es'
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
        )}
        title="Cambiar a Español"
      >
        ES
      </button>
      <span className="text-slate-300 dark:text-slate-700 text-[10px]">|</span>
      <button
        type="button"
        onClick={() => toggleLanguage('en')}
        className={cn(
          'rounded px-1.5 py-0.5 font-bold transition-colors',
          language === 'en'
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
        )}
        title="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
