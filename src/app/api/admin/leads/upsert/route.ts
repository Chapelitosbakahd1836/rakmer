import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json();
  const { lead_id, funil_step, status, followup_count, reason } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Update lead
  const { data: lead, error: updateError } = await supabase
    .from('leads')
    .update({
      funil_step,
      status,
      followup_count,
      updated_at: new Date().toISOString()
    })
    .eq('id', lead_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Insert into atividades_cliente if client exists and reason is given
  if (reason && lead.cliente_id) {
    await supabase.from('atividades_cliente').insert({
      cliente_id: lead.cliente_id,
      tipo: 'funil_mudanca',
      descricao: reason,
    });
  }

  return NextResponse.json(lead);
}
