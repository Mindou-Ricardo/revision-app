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
import { FolderCard } from '@/components/FolderCard';
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
  ArrowLeft,
  FolderOpen,
  FolderPlus,
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

  // Navigation par répertoires
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Filters & Search
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

  // Raccourcis clavier globaux (/, n, p, Echap)
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
      } else if (e.key === 'Escape' && selectedFolder) {
        setSelectedFolder(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [selectedFolder]);

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
    if (confirm('Supprimer cette notion ?')) {
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

  // Regroupement de tous les items par Répertoire (Catégorie)
  const foldersMap = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const item of items) {
      const cat = item.category || 'Général';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [items]);

  // Liste des répertoires filtrée par recherche sur l'accueil
  const filteredFolders = useMemo(() => {
    const folderNames = Object.keys(foldersMap);
    if (!searchQuery.trim()) return folderNames;
    const q = searchQuery.toLowerCase();
    return folderNames.filter(
      (name) =>
        name.toLowerCase().includes(q) ||
        foldersMap[name].some(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.target_text.toLowerCase().includes(q)
        )
    );
  }, [foldersMap, searchQuery]);

  // Liste des items dans le dossier sélectionné
  const folderItems = useMemo(() => {
    if (!selectedFolder) return [];
    const list = foldersMap[selectedFolder] || [];
    return list.filter((item) => {
      const isDone = isCompletedToday(item.progress?.last_completed_date);
      if (filterTab === 'todo' && isDone) return false;
      if (filterTab === 'done' && !isDone) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchText = item.target_text.toLowerCase().includes(q);
        if (!matchTitle && !matchText) return false;
      }
      return true;
    });
  }, [foldersMap, selectedFolder, filterTab, searchQuery]);

  // Statistiques globales
  const totalCount = items.length;
  const completedTodayCount = items.filter((i) =>
    isCompletedToday(i.progress?.last_completed_date)
  ).length;

  // Statistiques du dossier sélectionné
  const selectedFolderAllItems = selectedFolder ? foldersMap[selectedFolder] || [] : [];
  const selectedFolderDoneCount = selectedFolderAllItems.filter((i) =>
    isCompletedToday(i.progress?.last_completed_date)
  ).length;

  const getFolderIcon = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('docker')) return <Box className="w-5 h-5 text-blue-500" />;
    if (lower.includes('git')) return <GitBranch className="w-5 h-5 text-blue-500" />;
    if (lower.includes('linux')) return <Terminal className="w-5 h-5 text-blue-400" />;
    if (lower.includes('sql') || lower.includes('base')) return <Database className="w-5 h-5 text-blue-500" />;
    if (lower.includes('archi') || lower.includes('déf')) return <BookOpen className="w-5 h-5 text-blue-400" />;
    return <Folder className="w-5 h-5 text-blue-500" />;
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

        {/* ------------------------------------------------------------- */}
        {/* VUE 1 : ACCUEIL — QUE LES RÉPERTOIRES (FOLDERS)               */}
        {/* ------------------------------------------------------------- */}
        {!selectedFolder ? (
          <div>
            {/* Hero / Header Accueil Répertoires */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                  <span>Mes Répertoires de Révision</span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Chaque répertoire regroupe les notions et commandes d&apos;une technologie. Choisis un répertoire pour t&apos;entraîner.
                </p>
              </div>

              {/* Actions Rapides */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsPacksModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-all"
                >
                  <Package className="w-4 h-4 text-blue-500" />
                  <span>Importer un Pack</span>
                </button>

                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm shadow-blue-600/25 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Répertoire / Notion</span>
                </button>
              </div>
            </div>

            {/* Search & Backup Bar */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un répertoire ou une commande... (Tape /)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Import / Export JSON */}
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Importer un fichier JSON"
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportDataAsJSON(items)}
                  title="Sauvegarder tout en JSON"
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grille des Répertoires uniquement */}
            {isLoading ? (
              <div className="py-20 text-center text-zinc-400 text-sm">
                Chargement de tes répertoires...
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 p-8">
                <FolderOpen className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-base mb-1">
                  Aucun répertoire trouvé
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? 'Aucun répertoire ne correspond à ta recherche.'
                    : 'Commence par créer ton premier répertoire ou importer un pack thématique.'}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer un premier répertoire</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFolders.map((folderName) => (
                  <FolderCard
                    key={folderName}
                    name={folderName}
                    items={foldersMap[folderName] || []}
                    onOpen={(name) => {
                      setSelectedFolder(name);
                      setSearchQuery('');
                      setFilterTab('all');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VUE 2 : À L'INTÉRIEUR DU RÉPERTOIRE SÉLECTIONNÉ               */
          /* ------------------------------------------------------------- */
          <div>
            {/* Bouton Retour aux Répertoires */}
            <button
              onClick={() => {
                setSelectedFolder(null);
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>← Retour à tous les répertoires</span>
            </button>

            {/* Folder Header Banner */}
            <div className="bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                    {getFolderIcon(selectedFolder)}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {selectedFolder}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {selectedFolderAllItems.length} notion(s) • {selectedFolderDoneCount} validée(s) aujourd&apos;hui
                    </p>
                  </div>
                </div>

                {/* Actions inside folder */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm shadow-blue-600/25 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter dans {selectedFolder}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filtres internes au répertoire */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    filterTab === 'all'
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Toutes ({selectedFolderAllItems.length})</span>
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
                  <span>À faire ({selectedFolderAllItems.length - selectedFolderDoneCount})</span>
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
                  <span>Validées ({selectedFolderDoneCount})</span>
                </button>
              </div>

              {/* Search in this folder */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Chercher dans ${selectedFolder}...`}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Grille des notions du dossier sélectionné */}
            {folderItems.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 p-8">
                <Clock className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-base mb-1">
                  Aucune notion dans ce répertoire
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? 'Aucun résultat ne correspond à ta recherche.'
                    : `Ajoute ta première commande ou définition dans le dossier ${selectedFolder}.`}
                </p>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une notion</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folderItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onStartDrill={(target) => setActiveDrillItem(target)}
                    onDelete={handleDeleteItem}
                    onEdit={handleEditItem}
                  />
                ))}
              </div>
            )}
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
        defaultCategory={selectedFolder || undefined}
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
