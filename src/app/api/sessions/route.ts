import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const { itemId, mode } = await request.json();
    if (!itemId) {
      return NextResponse.json({ error: "L'identifiant de la notion est requis" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // 1. Enregistrer la session
    const { error: sessionError } = await supabase.from('repetition_sessions').insert({
      item_id: itemId,
      repetitions_count: 21,
      mode: mode || 'typing',
    });

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    // 2. Mettre à jour item_progress
    const { data: progress } = await supabase
      .from('item_progress')
      .select('*')
      .eq('item_id', itemId)
      .single();

    let newStreak = 1;
    let totalReps = 21;

    if (progress) {
      totalReps = (progress.total_repetitions || 0) + 21;
      if (progress.last_completed_date === today) {
        newStreak = progress.current_streak;
      } else {
        newStreak = (progress.current_streak || 0) + 1;
      }
    }

    const { data: updatedProgress, error: progError } = await supabase
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

    if (progError) {
      return NextResponse.json({ error: progError.message }, { status: 500 });
    }

    return NextResponse.json({ progress: updatedProgress });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
