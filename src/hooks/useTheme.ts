import { useEffect } from 'react';
import { useJobStore } from '../store/useJobStore';

export function useTheme() {
  const theme = useJobStore((state) => state.theme);
  const setTheme = useJobStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    // Listen to OS preference changes if system mode is selected
    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme]);

  const toggleTheme = () => {
    const currentIsDark = document.documentElement.classList.contains('dark');
    setTheme(currentIsDark ? 'light' : 'dark');
  };

  return { theme, setTheme, toggleTheme };
}
