'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Item, DrillMode } from '@/types';
import {
  fetchItems,
  saveNewItem,
  updateExistingItem,
  removeItem,
  renameCategory,
  deleteCategory,
  completeRepetitionSession,
  isCompletedToday,
  exportDataAsJSON,
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import { FolderCard } from '@/components/FolderCard';
import { ItemCard } from '@/components/ItemCard';
import { DrillModal } from '@/components/DrillModal';
import { ItemFormModal } from '@/components/ItemFormModal';
import {
  Search,
  Zap,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Layers,
  Download,
  Upload,
  ArrowLeft,
  FolderOpen,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { FolderIcon } from '@/components/FolderIcon';

// Répertoire ouvert, conservé le temps de l'onglet pour survivre à une actualisation.
const SELECTED_FOLDER_KEY = 'memora_selected_folder';

function persistSelectedFolder(name: string | null) {
  try {
    if (name) sessionStorage.setItem(SELECTED_FOLDER_KEY, name);
    else sessionStorage.removeItem(SELECTED_FOLDER_KEY);
  } catch {
    // sessionStorage indisponible
  }
}

function readSelectedFolder(): string | null {
  try {
    return sessionStorage.getItem(SELECTED_FOLDER_KEY);
  } catch {
    return null;
  }
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [isSupabase, setIsSupabase] = useState<boolean>(isSupabaseConfigured);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Navigation par répertoires
  const [selectedFolder, setSelectedFolderState] = useState<string | null>(null);
  const setSelectedFolder = (name: string | null) => {
    setSelectedFolderState(name);
    persistSelectedFolder(name);
  };

  // Filters & Search
  const [filterTab, setFilterTab] = useState<'all' | 'todo' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [activeDrillItem, setActiveDrillItem] = useState<Item | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Renommage du répertoire ouvert
  const [isRenamingFolder, setIsRenamingFolder] = useState<boolean>(false);
  const [folderNameDraft, setFolderNameDraft] = useState<string>('');
  const [isFolderBusy, setIsFolderBusy] = useState<boolean>(false);

  // Charger les données au démarrage, puis restaurer le répertoire ouvert
  useEffect(() => {
    let cancelled = false;
    fetchItems()
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setIsSupabase(res.isSupabase);
        const savedFolder = readSelectedFolder();
        if (savedFolder && res.items.some((i) => (i.category || 'Général') === savedFolder)) {
          setSelectedFolderState(savedFolder);
        }
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Erreur inconnue');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Raccourcis clavier globaux (/, n, Echap)
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
      } else if (e.key === 'Escape' && selectedFolder) {
        setSelectedFolderState(null);
        persistSelectedFolder(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [selectedFolder]);

  // Un répertoire n'existe que par ses notions : s'il devient vide, il disparaît.
  // Dans ce cas on quitte la vue du répertoire (ou on suit la notion déplacée).
  const applyItemsChange = (nextItems: Item[], fallbackFolder: string | null = null) => {
    setItems(nextItems);
    if (selectedFolder && !nextItems.some((i) => (i.category || 'Général') === selectedFolder)) {
      setSelectedFolder(fallbackFolder);
      setIsRenamingFolder(false);
    }
  };

  const handleSaveItem = async (
    itemData: Omit<Item, 'id' | 'created_at' | 'progress'>
  ) => {
    if (editingItem) {
      const updated = await updateExistingItem(editingItem.id, itemData);
      if (updated) {
        applyItemsChange(
          items.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i)),
          updated.category || 'Général'
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

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Supprimer cette notion ?')) return;
    try {
      await removeItem(itemId);
      applyItemsChange(items.filter((item) => item.id !== itemId));
    } catch (e) {
      console.error(e);
      alert(`Suppression impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  const startRenameFolder = () => {
    if (!selectedFolder) return;
    setFolderNameDraft(selectedFolder);
    setIsRenamingFolder(true);
  };

  const handleRenameFolder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedFolder) return;
    const newName = folderNameDraft.trim();
    if (!newName || newName === selectedFolder) {
      setIsRenamingFolder(false);
      return;
    }
    if (
      items.some((i) => (i.category || 'Général') === newName) &&
      !confirm(`Le répertoire « ${newName} » existe déjà. Fusionner « ${selectedFolder} » dedans ?`)
    ) {
      return;
    }

    setIsFolderBusy(true);
    try {
      await renameCategory(selectedFolder, newName);
      setItems((prev) =>
        prev.map((i) => ((i.category || 'Général') === selectedFolder ? { ...i, category: newName } : i))
      );
      setSelectedFolder(newName);
      setIsRenamingFolder(false);
    } catch (err) {
      console.error(err);
      alert(`Renommage impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setIsFolderBusy(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;
    const count = items.filter((i) => (i.category || 'Général') === selectedFolder).length;
    if (
      !confirm(
        `Supprimer le répertoire « ${selectedFolder} » et ses ${count} notion(s) ?\nLa progression associée sera aussi supprimée. Action irréversible.`
      )
    ) {
      return;
    }

    setIsFolderBusy(true);
    try {
      await deleteCategory(selectedFolder);
      setItems((prev) => prev.filter((i) => (i.category || 'Général') !== selectedFolder));
      setSelectedFolder(null);
    } catch (err) {
      console.error(err);
      alert(`Suppression impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setIsFolderBusy(false);
    }
  };

  const handleSessionComplete = async (itemId: string, mode: DrillMode) => {
    const targetDays = items.find((i) => i.id === itemId)?.target_days ?? 7;
    try {
      const updatedProg = await completeRepetitionSession(itemId, mode, targetDays);
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, progress: updatedProg } : item
        )
      );
    } catch (e) {
      console.error(e);
      alert(`Progression non enregistrée : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const addedItems: Item[] = [];
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) {
        alert('Le fichier JSON doit contenir une liste de notions.');
      } else {
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
        alert(`${addedItems.length} notion(s) importée(s) avec succès !`);
      }
    } catch (e) {
      console.error(e);
      alert(
        e instanceof SyntaxError
          ? 'Erreur lors de la lecture du fichier JSON.'
          : `Import interrompu après ${addedItems.length} notion(s) : ${e instanceof Error ? e.message : 'erreur inconnue'}`
      );
    } finally {
      // Les notions déjà créées restent affichées, même si l'import a échoué en cours de route
      if (addedItems.length > 0) setItems((prev) => [...addedItems, ...prev]);
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

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        isSupabase={isSupabase}
        totalCards={totalCount}
        completedTodayCount={completedTodayCount}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Banner if in Local Storage mode with quick Supabase guide */}
        {!isLoading && !isSupabase && (
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
        {isLoading ? (
          /* Écran neutre pendant le chargement : évite d'afficher l'accueil
             puis de basculer sur le répertoire restauré. */
          <div
            role="status"
            className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400 text-sm"
          >
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Chargement de tes répertoires...</span>
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="py-16 text-center border border-rose-200 dark:border-rose-900/50 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 p-8"
          >
            <h3 className="font-bold text-rose-700 dark:text-rose-300 text-base mb-1">
              Impossible de charger tes répertoires
            </h3>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 max-w-md mx-auto mb-4 break-words">
              {loadError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs"
            >
              Réessayer
            </button>
          </div>
        ) : !selectedFolder ? (
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
            {filteredFolders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 p-8">
                <FolderOpen className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-base mb-1">
                  Aucun répertoire trouvé
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? 'Aucun répertoire ne correspond à ta recherche.'
                    : 'Commence par créer ton premier répertoire ou importer un fichier JSON.'}
                </p>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddModalOpen(true);
                  }}
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
                setIsRenamingFolder(false);
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Retour à tous les répertoires</span>
            </button>

            {/* Folder Header Banner */}
            <div className="bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                    <FolderIcon name={selectedFolder} />
                  </div>
                  <div className="min-w-0">
                    {isRenamingFolder ? (
                      <form onSubmit={handleRenameFolder} className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          aria-label="Nouveau nom du répertoire"
                          value={folderNameDraft}
                          onChange={(e) => setFolderNameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              setIsRenamingFolder(false);
                            }
                          }}
                          disabled={isFolderBusy}
                          className="min-w-0 w-full max-w-xs px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={isFolderBusy}
                          title="Enregistrer le nom"
                          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRenamingFolder(false)}
                          disabled={isFolderBusy}
                          title="Annuler"
                          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight break-words">
                        {selectedFolder}
                      </h2>
                    )}
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {selectedFolderAllItems.length} notion(s) • {selectedFolderDoneCount} validée(s) aujourd&apos;hui
                    </p>
                  </div>
                </div>

                {/* Actions inside folder */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={startRenameFolder}
                    disabled={isFolderBusy || isRenamingFolder}
                    title="Renommer le répertoire"
                    className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Renommer</span>
                  </button>
                  <button
                    onClick={handleDeleteFolder}
                    disabled={isFolderBusy}
                    title="Supprimer le répertoire et toutes ses notions"
                    className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 dark:hover:border-rose-900 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
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
      {isAddModalOpen && (
        <ItemFormModal
          key={editingItem?.id ?? 'new'}
          initialData={editingItem}
          defaultCategory={selectedFolder || undefined}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}
