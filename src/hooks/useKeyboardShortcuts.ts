import { useEffect } from 'react';
import { useJobStore } from '../store/useJobStore';
import type { Job } from '../types';

interface UseKeyboardShortcutsProps {
  jobs: Job[];
}

export function useKeyboardShortcuts({ jobs }: UseKeyboardShortcutsProps) {
  const selectedJobId = useJobStore((state) => state.selectedJobId);
  const setSelectedJobId = useJobStore((state) => state.setSelectedJobId);
  const setApplyModalOpen = useJobStore((state) => state.setApplyModalOpen);
  const setCommandPaletteOpen = useJobStore((state) => state.setCommandPaletteOpen);
  const isCommandPaletteOpen = useJobStore((state) => state.isCommandPaletteOpen);
  const isApplyModalOpen = useJobStore((state) => state.isApplyModalOpen);
  const isShortcutsModalOpen = useJobStore((state) => state.isShortcutsModalOpen);
  const setShortcutsModalOpen = useJobStore((state) => state.setShortcutsModalOpen);
  const toggleSaveJob = useJobStore((state) => state.toggleSaveJob);
  const setMobileDetailOpen = useJobStore((state) => state.setMobileDetailOpen);
  const setTheme = useJobStore((state) => state.setTheme);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing inside an input, textarea, select, or contenteditable
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Global Command Palette Shortcut: Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      // Escape to close modals or command palette
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (isApplyModalOpen) {
          setApplyModalOpen(false);
          return;
        }
        if (isShortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        setMobileDetailOpen(false);
        return;
      }

      // If typing in an input field, do not trigger single-key navigation shortcuts
      if (isInputFocused) return;

      // Single key shortcuts only when modal is closed
      if (isCommandPaletteOpen || isApplyModalOpen || isShortcutsModalOpen) return;

      // J: Navigate Down
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (!jobs.length) return;
        const currentIndex = jobs.findIndex((j) => j.id === selectedJobId);
        if (currentIndex === -1) {
          setSelectedJobId(jobs[0].id);
        } else if (currentIndex < jobs.length - 1) {
          const nextJob = jobs[currentIndex + 1];
          setSelectedJobId(nextJob.id);
          // Auto scroll into view
          const el = document.getElementById(`job-card-${nextJob.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      // K: Navigate Up
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (!jobs.length) return;
        const currentIndex = jobs.findIndex((j) => j.id === selectedJobId);
        if (currentIndex > 0) {
          const prevJob = jobs[currentIndex - 1];
          setSelectedJobId(prevJob.id);
          // Auto scroll into view
          const el = document.getElementById(`job-card-${prevJob.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      // A: Quick Apply
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (selectedJobId) {
          setApplyModalOpen(true);
        }
        return;
      }

      // S: Save / Bookmark
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (selectedJobId) {
          toggleSaveJob(selectedJobId);
        }
        return;
      }

      // T: Toggle Theme (Light <-> Dark)
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const currentIsDark = document.documentElement.classList.contains('dark');
        setTheme(currentIsDark ? 'light' : 'dark');
        return;
      }

      // ?: Help / Shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    jobs,
    selectedJobId,
    setSelectedJobId,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isApplyModalOpen,
    setApplyModalOpen,
    isShortcutsModalOpen,
    setShortcutsModalOpen,
    toggleSaveJob,
    setMobileDetailOpen,
  ]);
}
