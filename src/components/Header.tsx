'use client';

import React from 'react';
import { Flame, Plus, Database, Laptop, Package } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenPacksModal: () => void;
  isSupabase: boolean;
  totalCards: number;
  completedTodayCount: number;
}

export function Header({
  onOpenAddModal,
  onOpenPacksModal,
  isSupabase,
  totalCards,
  completedTodayCount,
}: HeaderProps) {
  const percentToday = totalCards > 0 ? Math.round((completedTodayCount / totalCards) * 100) : 0;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
            21
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">
                21 Reps Drill
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                Ancrage
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              21 répétitions par jour • Mémoire musculaire & long terme
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Storage Mode indicator */}
          <div
            title={
              isSupabase
                ? 'Connecté à Supabase (PostgreSQL)'
                : 'Mode stockage local (LocalStorage)'
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900"
          >
            {isSupabase ? (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline">Supabase</span>
              </>
            ) : (
              <>
                <Laptop className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden md:inline">Local</span>
              </>
            )}
          </div>

          {/* Daily completion badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-xs font-semibold text-orange-700 dark:text-orange-300">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>
              {completedTodayCount}/{totalCards} ({percentToday}%)
            </span>
          </div>

          {/* Starter Packs Button */}
          <button
            onClick={onOpenPacksModal}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 text-zinc-700 dark:text-zinc-200 font-medium text-xs sm:text-sm rounded-lg shadow-2xs transition-all"
            title="Importer des packs de commandes (Git, Linux, Docker...)"
          >
            <Package className="w-4 h-4 text-orange-500" />
            <span className="hidden md:inline">Packs thématiques</span>
          </button>

          {/* New Item Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-medium text-xs sm:text-sm rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle notion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
