import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase non configuré (utilisez le fallback local ou ajoutez les clés .env)' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('items')
      .select('*, progress:item_progress(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const body = await request.json();
    const { title, target_text, type, category, target_days, explanation } = body;

    if (!title || !target_text) {
      return NextResponse.json(
        { error: 'Le titre et le texte cible sont obligatoires' },
        { status: 400 }
      );
    }

    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert({
        title,
        target_text,
        type: type || 'command',
        category: category || 'Général',
        target_days: target_days || 7,
        explanation,
      })
      .select()
      .single();

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    // Initialiser la progression
    await supabase.from('item_progress').insert({
      item_id: item.id,
      current_streak: 0,
      total_repetitions: 0,
      is_mastered: false,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
