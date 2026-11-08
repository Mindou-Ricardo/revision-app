'use client';

import React, { useState, useEffect } from 'react';
import { Item, DrillMode } from '@/types';
import {
  fetchItems,
  saveNewItem,
  removeItem,
  completeRepetitionSession,
  isCompletedToday,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { ItemCard } from '@/components/ItemCard';
import { DrillModal } from '@/components/DrillModal';
import { ItemFormModal } from '@/components/ItemFormModal';
import { StarterPacksModal } from '@/components/StarterPacksModal';
import {
  Search,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Layers,
  Package,
} from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [isSupabase, setIsSupabase] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [filterTab, setFilterTab] = useState<'all' | 'todo' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeDrillItem, setActiveDrillItem] = useState<Item | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPacksModalOpen, setIsPacksModalOpen] = useState<boolean>(false);

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchItems();
      setItems(res.items);
      setIsSupabase(res.isSupabase);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewItem = async (
    newItemData: Omit<Item, 'id' | 'created_at' | 'progress'>
  ) => {
    const created = await saveNewItem(newItemData);
    setItems((prev) => [created, ...prev]);
  };

  const handleImportPack = async (
    packItems: Array<Omit<Item, 'id' | 'created_at' | 'progress'>>
  ) => {
    const addedItems: Item[] = [];
    for (const itemData of packItems) {
      const created = await saveNewItem(itemData);
      addedItems.push(created);
    }
    setItems((prev) => [...addedItems, ...prev]);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Supprimer cette notion de ta liste ?')) {
      await removeItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const handleSessionComplete = async (itemId: string, mode: DrillMode) => {
    const updatedProg = await completeRepetitionSession(itemId, mode);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, progress: updatedProg } : item
      )
    );
  };

  // Extract categories
  const categories = ['Tous', ...Array.from(new Set(items.map((i) => i.category)))];

  // Calculs pour les statistiques du jour
  const totalCount = items.length;
  const completedTodayCount = items.filter((i) =>
    isCompletedToday(i.progress?.last_completed_date)
  ).length;
  const todoTodayCount = totalCount - completedTodayCount;

  // Filtrage des éléments affichés
  const filteredItems = items.filter((item) => {
    const isDone = isCompletedToday(item.progress?.last_completed_date);

    // Tab filter
    if (filterTab === 'todo' && isDone) return false;
    if (filterTab === 'done' && !isDone) return false;

    // Category filter
    if (selectedCategory !== 'Tous' && item.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchText = item.target_text.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchTitle && !matchText && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenPacksModal={() => setIsPacksModalOpen(true)}
        isSupabase={isSupabase}
        totalCards={totalCount}
        completedTodayCount={completedTodayCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Banner if in Local Storage mode with quick Supabase guide */}
        {!isSupabase && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Mode Démonstration & LocalStorage actif :</strong> Tes révisions sont
                enregistrées dans ton navigateur. Pour synchroniser avec ta base Supabase, renseigne
                tes clés dans <code className="bg-amber-200/50 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env.local</code>.
              </span>
            </div>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
            >
              <span>Voir Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Hero Section / Summary */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Tableau de bord des révisions
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                La règle des 21 : Répète chaque commande ou notion 21 fois par jour pour forcer
                l&apos;ancrage réflexe.
              </p>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterTab === 'all'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Toutes ({totalCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('todo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterTab === 'todo'
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                    : 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>À faire ({todoTodayCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('done')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterTab === 'done'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Validées ({completedTodayCount})</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Categories horizontal scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une notion..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Grid of Cards */}
        {isLoading ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            Chargement de tes notions...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/30 p-8">
            <Clock className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-base mb-1">
              Aucune notion trouvée
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Aucun résultat ne correspond à ta recherche.'
                : 'Commence par ajouter ta première commande ou importe un pack thématique.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsPacksModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 font-medium text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-2xs"
              >
                <Package className="w-4 h-4 text-orange-500" />
                <span>Packs thématiques</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une notion</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onStartDrill={(target) => setActiveDrillItem(target)}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Drill 21 Modal */}
      {activeDrillItem && (
        <DrillModal
          item={activeDrillItem}
          onClose={() => setActiveDrillItem(null)}
          onSessionComplete={handleSessionComplete}
        />
      )}

      {/* Add New Item Modal */}
      <ItemFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddNewItem}
      />

      {/* Starter Packs Modal */}
      <StarterPacksModal
        isOpen={isPacksModalOpen}
        onClose={() => setIsPacksModalOpen(false)}
        onImportPack={handleImportPack}
      />
    </div>
  );
}
