'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Item, DrillMode } from '@/types';
import {
  fetchItems,
  saveNewItem,
  updateExistingItem,
  removeItem,
  completeRepetitionSession,
  isCompletedToday,
  exportDataAsJSON,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { ItemCard } from '@/components/ItemCard';
import { DrillModal } from '@/components/DrillModal';
import { ItemFormModal } from '@/components/ItemFormModal';
import { StarterPacksModal } from '@/components/StarterPacksModal';
import {
  Search,
  Zap,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Layers,
  Package,
  Download,
  Upload,
  Box,
  GitBranch,
  Terminal,
  BookOpen,
  Database,
  Folder,
} from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [isSupabase, setIsSupabase] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [filterTab, setFilterTab] = useState<'all' | 'todo' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [activeDrillItem, setActiveDrillItem] = useState<Item | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isPacksModalOpen, setIsPacksModalOpen] = useState<boolean>(false);

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  // Raccourcis clavier globaux (/, n, p)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingItem(null);
        setIsAddModalOpen(true);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPacksModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
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

  const handleSaveItem = async (
    itemData: Omit<Item, 'id' | 'created_at' | 'progress'>
  ) => {
    if (editingItem) {
      const updated = await updateExistingItem(editingItem.id, itemData);
      if (updated) {
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i))
        );
      }
      setEditingItem(null);
    } else {
      const created = await saveNewItem(itemData);
      setItems((prev) => [created, ...prev]);
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
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

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (Array.isArray(imported)) {
        const addedItems: Item[] = [];
        for (const itemData of imported) {
          if (itemData.title && itemData.target_text) {
            const created = await saveNewItem({
              title: itemData.title,
              target_text: itemData.target_text,
              type: itemData.type || 'command',
              category: itemData.category || 'Général',
              target_days: itemData.target_days || 7,
              explanation: itemData.explanation,
            });
            addedItems.push(created);
          }
        }
        setItems((prev) => [...addedItems, ...prev]);
        alert(`${addedItems.length} notion(s) importée(s) avec succès !`);
      }
    } catch {
      alert('Erreur lors de la lecture du fichier JSON.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    return ['Tous', ...Array.from(new Set(items.map((i) => i.category)))];
  }, [items]);

  // Calculs statistiques
  const totalCount = items.length;
  const completedTodayCount = items.filter((i) =>
    isCompletedToday(i.progress?.last_completed_date)
  ).length;
  const todoTodayCount = totalCount - completedTodayCount;

  // Filtrage
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const isDone = isCompletedToday(item.progress?.last_completed_date);

      if (filterTab === 'todo' && isDone) return false;
      if (filterTab === 'done' && !isDone) return false;

      if (selectedCategory !== 'Tous' && item.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchText = item.target_text.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchText && !matchCat) return false;
      }

      return true;
    });
  }, [items, filterTab, selectedCategory, searchQuery]);

  // Regroupement par Catégorie (Groupes)
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    for (const item of filteredItems) {
      const cat = item.category || 'Général';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [filteredItems]);

  const getCategoryIcon = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('docker')) return <Box className="w-4 h-4 text-blue-500" />;
    if (lower.includes('git')) return <GitBranch className="w-4 h-4 text-blue-500" />;
    if (lower.includes('linux')) return <Terminal className="w-4 h-4 text-blue-400" />;
    if (lower.includes('sql') || lower.includes('base')) return <Database className="w-4 h-4 text-blue-500" />;
    if (lower.includes('archi') || lower.includes('déf')) return <BookOpen className="w-4 h-4 text-blue-400" />;
    return <Folder className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenPacksModal={() => setIsPacksModalOpen(true)}
        isSupabase={isSupabase}
        totalCards={totalCount}
        completedTodayCount={completedTodayCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Banner if in Local Storage mode with quick Supabase guide */}
        {!isSupabase && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-950 dark:text-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Mode Démonstration & LocalStorage :</strong> Données locales. Pour synchroniser avec Supabase, ajoute tes clés dans <code className="bg-blue-200/50 dark:bg-blue-900/60 px-1 py-0.5 rounded font-mono">.env.local</code>.
              </span>
            </div>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 hover:underline shrink-0"
            >
              <span>Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Hero Section / Summary */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Tableau de bord des révisions
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 sm:mt-1">
                La règle des 21 : Répète chaque commande ou notion 21 fois par jour pour forcer
                l&apos;ancrage réflexe.
              </p>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  filterTab === 'all'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Toutes ({totalCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('todo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  filterTab === 'todo'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>À faire ({todoTodayCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('done')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  filterTab === 'done'
                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-2xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Validées ({completedTodayCount})</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter bar, Search & Export/Import */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Categories horizontal scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box & JSON Export/Import */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher... (Tape /)"
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Hidden JSON file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importer des notions depuis un fichier JSON"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={() => exportDataAsJSON(items)}
              title="Exporter mes notions en JSON (Sauvegarde)"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Grouped by Category */}
        {isLoading ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            Chargement de tes notions...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 p-8">
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
                <Package className="w-4 h-4 text-blue-500" />
                <span>Packs thématiques</span>
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une notion</span>
              </button>
            </div>
          </div>
        ) : (
          /* Render by Category Groups */
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([groupCategory, groupList]) => {
              const groupDoneCount = groupList.filter((i) =>
                isCompletedToday(i.progress?.last_completed_date)
              ).length;
              const groupTotal = groupList.length;

              return (
                <section key={groupCategory} className="space-y-3">
                  {/* Group Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/40">
                        {getCategoryIcon(groupCategory)}
                      </div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {groupCategory}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {groupTotal}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className={groupDoneCount === groupTotal ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}>
                        {groupDoneCount}/{groupTotal} fait aujourd&apos;hui
                      </span>
                    </div>
                  </div>

                  {/* Grid of Cards for this Group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupList.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onStartDrill={(target) => setActiveDrillItem(target)}
                        onDelete={handleDeleteItem}
                        onEdit={handleEditItem}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
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

      {/* Add / Edit Item Modal */}
      <ItemFormModal
        isOpen={isAddModalOpen}
        initialData={editingItem}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
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
