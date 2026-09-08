import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { DetailsView } from './DetailsView';
import type { Job } from '../../types';

interface MobileDetailDrawerProps {
  job: Job | null;
  isLoading?: boolean;
}

export function MobileDetailDrawer({ job, isLoading }: MobileDetailDrawerProps) {
  const isMobileDetailOpen = useJobStore((state) => state.isMobileDetailOpen);
  const setMobileDetailOpen = useJobStore((state) => state.setMobileDetailOpen);

  return (
    <AnimatePresence>
      {isMobileDetailOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-slate-950/70 backdrop-blur-xs">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileDetailOpen(false)}
            className="absolute inset-0"
          />

          {/* Slide-up Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex flex-col h-[94vh] mt-auto w-full rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
          >
            {/* Mobile Header Bar with Back Button */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900">
              <button
                onClick={() => setMobileDetailOpen(false)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Job Feed</span>
              </button>

              <button
                onClick={() => setMobileDetailOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Scrollable Details */}
            <div className="flex-1 overflow-hidden">
              <DetailsView job={job} isLoading={isLoading} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
