import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const { error } = await supabase.from('items').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const body = await request.json();
    const { title, target_text, type, category, target_days, explanation } = body;

    const { data, error } = await supabase
      .from('items')
      .update({
        title,
        target_text,
        type,
        category,
        target_days,
        explanation,
      })
      .eq('id', id)
      .select('*, progress:item_progress(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

