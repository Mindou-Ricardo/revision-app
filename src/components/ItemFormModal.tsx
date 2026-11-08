'use client';

import React, { useState, useEffect } from 'react';
import { Item, ItemType } from '@/types';
import { X, Plus, Check, Terminal, BookOpen } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<Item, 'id' | 'created_at' | 'progress'>) => Promise<void>;
  initialData?: Item | null;
  defaultCategory?: string;
}

const POPULAR_CATEGORIES = ['Linux', 'Git', 'Docker', 'SQL', 'TypeScript', 'Réseau', 'Architecture'];

export function ItemFormModal({ isOpen, onClose, onSave, initialData, defaultCategory }: ItemFormModalProps) {
  const [title, setTitle] = useState('');
  const [targetText, setTargetText] = useState('');
  const [type, setType] = useState<ItemType>('command');
  const [category, setCategory] = useState('Linux');
  const [customCategory, setCustomCategory] = useState('');
  const [targetDays, setTargetDays] = useState(7);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setTargetText(initialData.target_text);
      setType(initialData.type);
      if (POPULAR_CATEGORIES.includes(initialData.category)) {
        setCategory(initialData.category);
        setCustomCategory('');
      } else {
        setCategory('Autre');
        setCustomCategory(initialData.category);
      }
      setTargetDays(initialData.target_days || 7);
      setExplanation(initialData.explanation || '');
    } else {
      setTitle('');
      setTargetText('');
      setType('command');
      const catToUse = defaultCategory || 'Linux';
      if (POPULAR_CATEGORIES.includes(catToUse)) {
        setCategory(catToUse);
        setCustomCategory('');
      } else {
        setCategory('Autre');
        setCustomCategory(catToUse);
      }
      setTargetDays(7);
      setExplanation('');
    }
  }, [initialData, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetText.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        target_text: targetText.trim(),
        type,
        category: customCategory.trim() || category,
        target_days: Number(targetDays) || 7,
        explanation: explanation.trim() || undefined,
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {isEditing ? 'Modifier la notion' : 'Ajouter une notion à ancrer'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Type de contenu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('command')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === 'command'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Terminal className="w-4 h-4 text-blue-500" />
                <span>Commande Terminal</span>
              </button>
              <button
                type="button"
                onClick={() => setType('definition')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === 'definition'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Définition théorique</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Titre / Objectif
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lister tous les ports ouverts sur la machine"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Target Text */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Texte exact à répéter 21 fois (Commande ou définition précise)
            </label>
            <textarea
              required
              rows={2}
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              placeholder="Ex: ss -tulpn"
              className="w-full px-3.5 py-2.5 font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Catégorie (Groupe)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POPULAR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Autre">Autre...</option>
              </select>
              {category === 'Autre' && (
                <input
                  type="text"
                  placeholder="Nom de catégorie..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              )}
            </div>

            {/* Target consecutive days */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Objectif de jours consécutifs
              </label>
              <select
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7 jours (1 semaine)</option>
                <option value={14}>14 jours (2 semaines)</option>
                <option value={21}>21 jours (Ancrage total)</option>
                <option value={30}>30 jours (Habitude réflexe)</option>
              </select>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Astuce / Explication (Optionnel)
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Ex: -t pour TCP, -u pour UDP, -l pour listening, -n pour numeric"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-sm shadow-sm shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {isSubmitting
                  ? 'Enregistrement...'
                  : isEditing
                  ? 'Enregistrer les modifications'
                  : 'Enregistrer la notion'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
