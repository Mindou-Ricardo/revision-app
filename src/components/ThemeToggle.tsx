'use client';

import React, { useLayoutEffect, useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage indisponible (navigation privée, etc.)
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Le thème réel vit sur <html class="dark"> (posé par le script inline du layout).
// On s'abonne aux changements de cette classe plutôt que de dupliquer l'état.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

const getServerSnapshot = (): Theme | null => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // En dev, le remontage du Strict Mode efface la classe posée par le script inline :
  // on la ré-applique avant l'affichage. Sans effet en production.
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applyTheme(next);
  };

  if (theme === null) {
    return (
      <div className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-blue-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
