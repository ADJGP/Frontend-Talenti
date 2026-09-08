import { Dialog, DialogHeader, DialogContent } from '../ui/dialog';
import { useJobStore } from '../../store/useJobStore';
import { useTranslation } from '../../i18n';
import { Keyboard, Sparkles } from 'lucide-react';

export function ShortcutsModal() {
  const { t } = useTranslation();
  const isShortcutsModalOpen = useJobStore((state) => state.isShortcutsModalOpen);
  const setShortcutsModalOpen = useJobStore((state) => state.setShortcutsModalOpen);

  const shortcuts = [
    { key: 'J', action: t.scNextJob },
    { key: 'K', action: t.scPrevJob },
    { key: 'A', action: t.scApply },
    { key: 'S', action: t.scBookmark },
    { key: 'T', action: t.scTheme },
    { key: '⌘ + K', action: t.scPalette },
    { key: 'ESC', action: t.scEscape },
    { key: '?', action: t.scHelp },
  ];

  return (
    <Dialog
      open={isShortcutsModalOpen}
      onOpenChange={setShortcutsModalOpen}
      maxWidth="md"
    >
      <DialogHeader onClose={() => setShortcutsModalOpen(false)}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Keyboard className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.shortcutsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.shortcutsSub}
            </p>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="space-y-4">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {s.action}
              </span>
              <kbd className="inline-flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200 dark:border-slate-700">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 p-3 text-xs text-indigo-900 dark:text-indigo-200">
          <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>
            {t.scTip}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
