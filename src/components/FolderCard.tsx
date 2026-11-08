'use client';

import React from 'react';
import { Item } from '@/types';
import { isCompletedToday } from '@/lib/storage';
import {
  Folder,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
  Zap,
  Box,
  GitBranch,
  Terminal,
  BookOpen,
  Database,
} from 'lucide-react';

interface FolderCardProps {
  name: string;
  items: Item[];
  onOpen: (folderName: string) => void;
}

export function FolderCard({ name, items, onOpen }: FolderCardProps) {
  const total = items.length;
  const completedToday = items.filter((i) =>
    isCompletedToday(i.progress?.last_completed_date)
  ).length;
  const isAllDone = total > 0 && completedToday === total;
  const progressPercent = total > 0 ? Math.round((completedToday / total) * 100) : 0;

  const getFolderIcon = (folderName: string) => {
    const lower = folderName.toLowerCase();
    if (lower.includes('docker')) return <Box className="w-6 h-6 text-blue-500" />;
    if (lower.includes('git')) return <GitBranch className="w-6 h-6 text-blue-500" />;
    if (lower.includes('linux')) return <Terminal className="w-6 h-6 text-blue-400" />;
    if (lower.includes('sql') || lower.includes('base')) return <Database className="w-6 h-6 text-blue-500" />;
    if (lower.includes('archi') || lower.includes('déf')) return <BookOpen className="w-6 h-6 text-blue-400" />;
    return <Folder className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div
      onClick={() => onOpen(name)}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/70 dark:hover:border-blue-500/70 rounded-3xl p-6 transition-all duration-200 shadow-2xs hover:shadow-lg cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top bar with Icon and Notion Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
            {getFolderIcon(name)}
          </div>

          {isAllDone ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Complété</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-current" />
              <span>{total - completedToday} à réviser</span>
            </span>
          )}
        </div>

        {/* Directory Name & Description */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
          {name}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          {total} {total > 1 ? 'notions & commandes' : 'notion'} dans ce répertoire
        </p>
      </div>

      {/* Progress & Open Action */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          <span>Aujourd&apos;hui</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {completedToday} / {total} ({progressPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Button */}
        <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
          <span>Ouvrir le répertoire</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
