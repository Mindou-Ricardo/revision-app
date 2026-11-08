'use client';

import React, { useState } from 'react';
import { STARTER_PACKS, StarterPack } from '@/lib/starterPacks';
import { Item } from '@/types';
import { X, Package, Check, Terminal, GitBranch, Box, BookOpen, Plus } from 'lucide-react';

interface StarterPacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPack: (items: Array<Omit<Item, 'id' | 'created_at' | 'progress'>>) => Promise<void>;
}

export function StarterPacksModal({ isOpen, onClose, onImportPack }: StarterPacksModalProps) {
  const [importedPackIds, setImportedPackIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleImport = async (pack: StarterPack) => {
    setIsImporting(true);
    try {
      await onImportPack(pack.items);
      setImportedPackIds((prev) => [...prev, pack.id]);
    } finally {
      setIsImporting(false);
    }
  };

  const getPackIcon = (iconName: string) => {
    switch (iconName) {
      case 'GitBranch':
        return <GitBranch className="w-5 h-5 text-orange-500" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-emerald-500" />;
      case 'Box':
        return <Box className="w-5 h-5 text-sky-500" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-purple-500" />;
      default:
        return <Package className="w-5 h-5 text-zinc-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Packs de Révision Thématiques
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of packs */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Importe en un clic des sélections de commandes et définitions prêtes pour ton entraînement 21 répétitions.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {STARTER_PACKS.map((pack) => {
              const alreadyImported = importedPackIds.includes(pack.id);

              return (
                <div
                  key={pack.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                      {getPackIcon(pack.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {pack.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {pack.items.length} notions
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {pack.description}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={alreadyImported || isImporting}
                    onClick={() => handleImport(pack)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                      alreadyImported
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white shadow-xs'
                    }`}
                  >
                    {alreadyImported ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Importé !</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Importer</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
