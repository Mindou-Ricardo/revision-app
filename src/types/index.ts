export type ItemType = 'command' | 'definition';

export type DrillMode = 'typing' | 'verbal';

export interface Item {
  id: string;
  user_id?: string;
  title: string;
  target_text: string;
  type: ItemType;
  category: string;
  target_days: number;
  explanation?: string;
  created_at: string;
  // Computed / joined fields
  progress?: ItemProgress;
}

export interface ItemProgress {
  id?: string;
  item_id: string;
  current_streak: number;
  last_completed_date: string | null; // format YYYY-MM-DD
  total_repetitions: number;
  is_mastered: boolean;
  updated_at?: string;
}

export interface RepetitionSession {
  id?: string;
  item_id: string;
  repetitions_count: number;
  mode: DrillMode;
  completed_at: string;
}
