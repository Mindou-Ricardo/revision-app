'use client';

import React, { useState } from 'react';
import { Item } from '@/types';
import { isCompletedToday } from '@/lib/storage';
import { Play, Copy, Check, Trash2, Zap, Terminal, BookOpen } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onStartDrill: (item: Item) => void;
  onDelete: (itemId: string) => void;
}

export function ItemCard({ item, onStartDrill, onDelete }: ItemCardProps) {
  const [copied, setCopied] = useState(false);
  const doneToday = isCompletedToday(item.progress?.last_completed_date);
  const streak = item.progress?.current_streak || 0;
  const targetDays = item.target_days || 7;
  const streakPercent = Math.min(100, Math.round((streak / targetDays) * 100));

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.target_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group relative bg-white dark:bg-zinc-900/90 border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md ${
        doneToday
          ? 'border-zinc-200 dark:border-zinc-800 opacity-90'
          : 'border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/60 dark:hover:border-blue-500/60'
      }`}
    >
      <div>
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
              {item.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {item.type === 'command' ? (
                <>
                  <Terminal className="w-3 h-3 text-blue-500" />
                  <span>Cmd</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3 h-3 text-blue-400" />
                  <span>Déf</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {doneToday ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                <Check className="w-3 h-3 text-blue-500" /> Validé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/50">
                <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400 fill-current" /> À faire
              </span>
            )}
            <button
              onClick={() => onDelete(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition-opacity ml-1"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Title */}
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-snug mb-3">
          {item.title}
        </h3>

        {/* Target Text Snippet */}
        <div className="relative mb-4 group/code">
          <div className="font-mono text-xs p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-blue-700 dark:text-blue-300 border border-zinc-200 dark:border-zinc-800/80 select-all break-all pr-8">
            {item.target_text}
          </div>
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2.5 p-1 rounded-md bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-2xs border border-zinc-200 dark:border-zinc-700"
            title="Copier le texte"
          >
            {copied ? <Check className="w-3 h-3 text-blue-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Footer: Streak and Action Button */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Streak bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
              <Zap
                className={`w-3.5 h-3.5 ${
                  streak > 0 ? 'text-blue-600 dark:text-blue-400 fill-current' : 'text-zinc-400'
                }`}
              />
              {streak} / {targetDays} jours
            </span>
            <span className="text-[11px] text-zinc-400">
              {item.progress?.total_repetitions || 0} reps
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 rounded-full"
              style={{ width: `${streakPercent}%` }}
            />
          </div>
        </div>

        {/* Launch Drill Button */}
        <button
          onClick={() => onStartDrill(item)}
          className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 ${
            doneToday
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/20'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{doneToday ? 'S’entraîner encore (21x)' : 'Lancer le Drill 21'}</span>
        </button>
      </div>
    </div>
  );
}
