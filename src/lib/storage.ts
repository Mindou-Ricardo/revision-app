import { Item, ItemProgress, DrillMode } from '@/types';
import { DEFAULT_ITEMS } from './defaultData';
import { createClient } from './supabase/client';

const LOCAL_STORAGE_KEY = 'revision_21_items_v1';
const REPS_PER_SESSION = 21;

type ItemInput = Omit<Item, 'id' | 'created_at' | 'progress'>;

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return toDateString(new Date());
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

export function isCompletedToday(lastCompletedDate?: string | null): boolean {
  if (!lastCompletedDate) return false;
  return lastCompletedDate === getTodayString();
}

/**
 * Série de jours *consécutifs* :
 * - déjà validé aujourd'hui → inchangée
 * - validé hier → +1
 * - sinon (jour manqué ou jamais fait) → repart à 1
 */
function computeNextStreak(lastCompletedDate: string | null | undefined, currentStreak: number): number {
  const today = getTodayString();
  if (lastCompletedDate === today) return Math.max(currentStreak, 1);
  if (lastCompletedDate === getYesterdayString()) return currentStreak + 1;
  return 1;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ItemRow = Omit<Item, 'progress'> & { progress?: ItemProgress | ItemProgress[] | null };

function mapRow(row: ItemRow): Item {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    target_text: row.target_text,
    type: row.type,
    category: row.category,
    target_days: row.target_days,
    explanation: row.explanation ?? undefined,
    created_at: row.created_at,
    progress: (Array.isArray(row.progress) ? row.progress[0] : row.progress) ?? undefined,
  };
}

function emptyProgress(itemId: string): ItemProgress {
  return {
    item_id: itemId,
    current_streak: 0,
    last_completed_date: null,
    total_repetitions: 0,
    is_mastered: false,
  };
}

/** Lecture sûre du localStorage (JSON corrompu ou stockage indisponible → valeurs par défaut). */
function readLocalItems(): Item[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Item[]) : null;
  } catch {
    return null;
  }
}

function writeLocalItems(items: Item[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Impossible d’écrire dans le localStorage :', e);
  }
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

const SELECT_WITH_PROGRESS = '*, progress:item_progress(*)';

async function fetchFromSupabase(): Promise<Item[] | null> {
  const supabase = createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('items')
      .select(SELECT_WITH_PROGRESS)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Erreur Supabase, bascule sur localStorage :', error);
      return null;
    }

    if (data.length > 0) return data.map(mapRow);

    // Base vide : insérer les notions d'exemple
    for (const item of DEFAULT_ITEMS) {
      const { data: inserted } = await supabase
        .from('items')
        .insert({
          title: item.title,
          target_text: item.target_text,
          type: item.type,
          category: item.category,
          target_days: item.target_days,
          explanation: item.explanation,
        })
        .select()
        .single();

      if (inserted) {
        await supabase.from('item_progress').insert({
          item_id: inserted.id,
          current_streak: 0,
          total_repetitions: 0,
          is_mastered: false,
        });
      }
    }

    const { data: seeded } = await supabase
      .from('items')
      .select(SELECT_WITH_PROGRESS)
      .order('created_at', { ascending: false });

    return (seeded ?? []).map(mapRow);
  } catch (e) {
    console.warn('Erreur Supabase, bascule sur localStorage :', e);
    return null;
  }
}

// Déduplique les appels simultanés (ex. double montage du Strict Mode en dev),
// sinon les notions d'exemple seraient insérées deux fois dans une base vide.
let inFlightFetch: Promise<{ items: Item[]; isSupabase: boolean }> | null = null;

export function fetchItems(): Promise<{ items: Item[]; isSupabase: boolean }> {
  if (!inFlightFetch) {
    inFlightFetch = (async () => {
      const remote = await fetchFromSupabase();
      if (remote) return { items: remote, isSupabase: true };

      const local = readLocalItems();
      if (local) return { items: local, isSupabase: false };

      writeLocalItems(DEFAULT_ITEMS);
      return { items: DEFAULT_ITEMS, isSupabase: false };
    })().finally(() => {
      inFlightFetch = null;
    });
  }
  return inFlightFetch;
}

// ---------------------------------------------------------------------------
// Écriture
// En mode Supabase, une erreur est remontée (throw) au lieu d'écrire en local :
// une écriture locale ne serait jamais relue et disparaîtrait à l'actualisation.
// ---------------------------------------------------------------------------

export async function saveNewItem(itemData: ItemInput): Promise<Item> {
  const supabase = createClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('items')
      .insert({
        title: itemData.title,
        target_text: itemData.target_text,
        type: itemData.type,
        category: itemData.category || 'Général',
        target_days: itemData.target_days || 7,
        explanation: itemData.explanation,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Création impossible');

    const { error: progError } = await supabase.from('item_progress').insert({
      item_id: data.id,
      current_streak: 0,
      total_repetitions: 0,
      is_mastered: false,
    });
    if (progError) console.warn('Progression initiale non créée :', progError);

    return { ...mapRow(data), progress: emptyProgress(data.id) };
  }

  const newItemId =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`;
  const newItem: Item = {
    ...itemData,
    id: newItemId,
    created_at: new Date().toISOString(),
    progress: emptyProgress(newItemId),
  };

  writeLocalItems([newItem, ...(readLocalItems() ?? DEFAULT_ITEMS)]);
  return newItem;
}

export async function updateExistingItem(itemId: string, updates: Partial<ItemInput>): Promise<Item | null> {
  const supabase = createClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('items')
      .update({
        title: updates.title,
        target_text: updates.target_text,
        type: updates.type,
        category: updates.category,
        target_days: updates.target_days,
        explanation: updates.explanation ?? null,
      })
      .eq('id', itemId)
      .select(SELECT_WITH_PROGRESS)
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Modification impossible');
    return mapRow(data);
  }

  const list = readLocalItems();
  if (!list) return null;

  let updatedItem: Item | null = null;
  const updatedList = list.map((item) => {
    if (item.id !== itemId) return item;
    updatedItem = { ...item, ...updates };
    return updatedItem;
  });
  writeLocalItems(updatedList);
  return updatedItem;
}

export async function removeItem(itemId: string): Promise<void> {
  const supabase = createClient();

  if (supabase) {
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (error) throw new Error(error.message);
    return;
  }

  const list = readLocalItems();
  if (list) writeLocalItems(list.filter((i) => i.id !== itemId));
}

export async function completeRepetitionSession(
  itemId: string,
  mode: DrillMode,
  targetDays: number
): Promise<ItemProgress> {
  const today = getTodayString();
  const supabase = createClient();

  if (supabase) {
    const { error: sessionError } = await supabase.from('repetition_sessions').insert({
      item_id: itemId,
      repetitions_count: REPS_PER_SESSION,
      mode,
    });
    if (sessionError) console.warn('Historique de session non enregistré :', sessionError);

    const { data: current, error: readError } = await supabase
      .from('item_progress')
      .select('*')
      .eq('item_id', itemId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);

    const newStreak = computeNextStreak(current?.last_completed_date, current?.current_streak ?? 0);

    // onConflict: 'item_id' — sans ça l'upsert vise la clé primaire `id`,
    // heurte la contrainte UNIQUE sur item_id et échoue.
    const { data: updated, error: upsertError } = await supabase
      .from('item_progress')
      .upsert(
        {
          item_id: itemId,
          current_streak: newStreak,
          last_completed_date: today,
          total_repetitions: (current?.total_repetitions ?? 0) + REPS_PER_SESSION,
          is_mastered: newStreak >= targetDays,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'item_id' }
      )
      .select()
      .single();

    if (upsertError || !updated) throw new Error(upsertError?.message ?? 'Progression non enregistrée');
    return updated;
  }

  const list = readLocalItems() ?? DEFAULT_ITEMS;
  let updatedProgress: ItemProgress = {
    ...emptyProgress(itemId),
    current_streak: 1,
    last_completed_date: today,
    total_repetitions: REPS_PER_SESSION,
  };

  const updatedList = list.map((item) => {
    if (item.id !== itemId) return item;
    const prev = item.progress ?? emptyProgress(itemId);
    const newStreak = computeNextStreak(prev.last_completed_date, prev.current_streak);
    updatedProgress = {
      ...prev,
      current_streak: newStreak,
      last_completed_date: today,
      total_repetitions: prev.total_repetitions + REPS_PER_SESSION,
      is_mastered: newStreak >= item.target_days,
    };
    return { ...item, progress: updatedProgress };
  });

  writeLocalItems(updatedList);
  return updatedProgress;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function exportDataAsJSON(items: Item[]): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `memora-backup-${getTodayString()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
