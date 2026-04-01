import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');
  const eventId = searchParams.get('event');
  const origin = searchParams.get('origin');
  const search = searchParams.get('search');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('leads')
    .select('id, nome, email, whatsapp, funil_step, status, followup_count, utm_source, created_at, updated_at, cliente_id, espetaculo_id, espetaculo:espetaculos(nome)')
    .order('updated_at', { ascending: false })
    .limit(500); // Prevent crashing if too many leads

  if (dateStr && dateStr !== 'all') {
    const dateLimit = new Date();
    dateLimit.setHours(0, 0, 0, 0); // start of today
    if (dateStr === 'semana') {
      dateLimit.setDate(dateLimit.getDate() - 7);
    } else if (dateStr === 'mes') {
      dateLimit.setDate(dateLimit.getDate() - 30);
    }
    query = query.gte('created_at', dateLimit.toISOString());
  }

  if (eventId && eventId !== 'all') {
    query = query.eq('espetaculo_id', eventId);
  }

  if (origin && origin !== 'all') {
    if (origin === 'Site') {
      query = query.or('utm_source.is.null,utm_source.eq.site,utm_source.eq.');
    } else {
      query = query.ilike('utm_source', `%${origin}%`);
    }
  }

  if (search) {
    query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
