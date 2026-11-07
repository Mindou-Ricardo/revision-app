import { Item, ItemProgress, DrillMode } from '@/types';
import { DEFAULT_ITEMS } from './defaultData';
import { createClient } from './supabase/client';

const LOCAL_STORAGE_KEY = 'revision_21_items_v1';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isCompletedToday(lastCompletedDate?: string | null): boolean {
  if (!lastCompletedDate) return false;
  return lastCompletedDate === getTodayString();
}

export async function fetchItems(): Promise<{ items: Item[]; isSupabase: boolean }> {
  const supabase = createClient();

  if (supabase) {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*, progress:item_progress(*)')
        .order('created_at', { ascending: false });

      if (!itemsError && itemsData) {
        const formatted: Item[] = itemsData.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          target_text: row.target_text,
          type: row.type,
          category: row.category,
          target_days: row.target_days,
          explanation: row.explanation,
          created_at: row.created_at,
          progress: Array.isArray(row.progress) ? row.progress[0] : row.progress,
        }));
        return { items: formatted, isSupabase: true };
      }
    } catch (e) {
      console.warn('Erreur Supabase, bascule sur localStorage:', e);
    }
  }

  // Fallback sur LocalStorage
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS));
      return { items: DEFAULT_ITEMS, isSupabase: false };
    }
    try {
      const parsed = JSON.parse(raw) as Item[];
      return { items: parsed, isSupabase: false };
    } catch {
      return { items: DEFAULT_ITEMS, isSupabase: false };
    }
  }

  return { items: DEFAULT_ITEMS, isSupabase: false };
}

export async function saveNewItem(
  itemData: Omit<Item, 'id' | 'created_at' | 'progress'>
): Promise<Item> {
  const supabase = createClient();
  const newItemId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`;
  const now = new Date().toISOString();

  if (supabase) {
    try {
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

      if (!error && data) {
        // Init progress row
        await supabase.from('item_progress').insert({
          item_id: data.id,
          current_streak: 0,
          total_repetitions: 0,
          is_mastered: false,
        });

        return {
          ...data,
          progress: {
            item_id: data.id,
            current_streak: 0,
            last_completed_date: null,
            total_repetitions: 0,
            is_mastered: false,
          },
        };
      }
    } catch (e) {
      console.warn('Erreur sauvegarde Supabase, sauvegarde locale...', e);
    }
  }

  // LocalStorage
  const newItem: Item = {
    ...itemData,
    id: newItemId,
    created_at: now,
    progress: {
      item_id: newItemId,
      current_streak: 0,
      last_completed_date: null,
      total_repetitions: 0,
      is_mastered: false,
    },
  };

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: Item[] = raw ? JSON.parse(raw) : DEFAULT_ITEMS;
    const updated = [newItem, ...list];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  return newItem;
}

export async function removeItem(itemId: string): Promise<void> {
  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('items').delete().eq('id', itemId);
    } catch (e) {
      console.warn('Erreur suppression Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const list: Item[] = JSON.parse(raw);
      const filtered = list.filter((i) => i.id !== itemId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  }
}

export async function completeRepetitionSession(
  itemId: string,
  mode: DrillMode
): Promise<ItemProgress> {
  const today = getTodayString();
  const supabase = createClient();

  if (supabase) {
    try {
      // 1. Enregistrer la session
      await supabase.from('repetition_sessions').insert({
        item_id: itemId,
        repetitions_count: 21,
        mode,
      });

      // 2. Mettre à jour la progression
      const { data: currentProgress } = await supabase
        .from('item_progress')
        .select('*')
        .eq('item_id', itemId)
        .single();

      let newStreak = 1;
      let totalReps = 21;

      if (currentProgress) {
        totalReps = (currentProgress.total_repetitions || 0) + 21;
        if (currentProgress.last_completed_date === today) {
          newStreak = currentProgress.current_streak; // Déjà fait aujourd'hui
        } else {
          // Calcul simple de streak : incrémenter
          newStreak = (currentProgress.current_streak || 0) + 1;
        }
      }

      const { data: updatedProg } = await supabase
        .from('item_progress')
        .upsert({
          item_id: itemId,
          current_streak: newStreak,
          last_completed_date: today,
          total_repetitions: totalReps,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (updatedProg) return updatedProg;
    } catch (e) {
      console.warn('Erreur mise à jour session Supabase:', e);
    }
  }

  // Fallback LocalStorage
  let updatedProgress: ItemProgress = {
    item_id: itemId,
    current_streak: 1,
    last_completed_date: today,
    total_repetitions: 21,
    is_mastered: false,
  };

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: Item[] = raw ? JSON.parse(raw) : DEFAULT_ITEMS;
    const updated = list.map((item) => {
      if (item.id === itemId) {
        const prevProg = item.progress || {
          item_id: itemId,
          current_streak: 0,
          last_completed_date: null,
          total_repetitions: 0,
          is_mastered: false,
        };

        const alreadyDoneToday = prevProg.last_completed_date === today;
        const newStreak = alreadyDoneToday ? prevProg.current_streak : prevProg.current_streak + 1;
        const total = prevProg.total_repetitions + 21;
        const mastered = newStreak >= item.target_days;

        updatedProgress = {
          ...prevProg,
          current_streak: newStreak,
          last_completed_date: today,
          total_repetitions: total,
          is_mastered: mastered,
        };

        return { ...item, progress: updatedProgress };
      }
      return item;
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  return updatedProgress;
}
