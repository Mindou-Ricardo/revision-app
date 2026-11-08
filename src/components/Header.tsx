'use client';

import React from 'react';
import { Zap, Plus, Database, Laptop } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AppLogo } from './AppLogo';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onOpenAddModal: () => void;
  isSupabase: boolean;
  totalCards: number;
  completedTodayCount: number;
  isLoading?: boolean;
}

export function Header({
  onOpenAddModal,
  isSupabase,
  totalCards,
  completedTodayCount,
  isLoading = false,
}: HeaderProps) {
  const percentToday = totalCards > 0 ? Math.round((completedTodayCount / totalCards) * 100) : 0;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <AppLogo className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm shrink-0" />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap">
                Memora
              </h1>
              <span className="hidden md:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
                Ancrage 21x
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden lg:block">
              Mémorisation par répétition • Mémoire musculaire
            </p>
          </div>
        </div>

        {/* Status, Theme Switcher & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* Storage Mode indicator */}
          <div
            title={
              isSupabase
                ? 'Connecté à Supabase (PostgreSQL)'
                : 'Mode stockage local (LocalStorage)'
            }
            className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900"
          >
            {isSupabase ? (
              <>
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden md:inline">Supabase</span>
              </>
            ) : (
              <>
                <Laptop className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="hidden md:inline">Local</span>
              </>
            )}
          </div>

          {/* Daily completion badge (desktop) — masqué tant que les données chargent */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-current" />
            <span className={isLoading ? 'invisible' : undefined}>
              {completedTodayCount}/{totalCards} ({percentToday}%)
            </span>
          </div>

          {/* New Item Button */}
          <button
            onClick={onOpenAddModal}
            className="p-2 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-xs sm:text-sm rounded-lg shadow-sm shadow-blue-600/25 transition-all flex items-center gap-1"
            title="Ajouter une notion"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle notion</span>
          </button>

          {/* Compte utilisateur (Google) */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
