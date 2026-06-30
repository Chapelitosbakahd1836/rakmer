// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import LeadSidePanel from './LeadSidePanel';
import { createClient } from '@supabase/supabase-js';

const COLUMNS = [
  { id: 'novo', title: 'NOVO LEAD', icon: '🆕' },
  { id: 'data', title: 'ESCOLHEU DATA', icon: '📅' },
  { id: 'lugar', title: 'ESCOLHEU LUGAR', icon: '🎟️' },
  { id: 'checkout', title: 'NO CHECKOUT', icon: '💳' },
  { id: 'followup1', title: 'FOLLOW-UP 1', icon: '📩' },
  { id: 'followup2', title: 'FOLLOW-UP 2', icon: '📩📩' },
  { id: 'followup3', title: 'FOLLOW-UP 3', icon: '📩📩📩' },
  { id: 'convertido', title: 'CONVERTIDO', icon: '✅' },
  { id: 'perdido', title: 'PERDIDO', icon: '❌' },
];

function getColumnIdForLead(lead) {
  if (lead.status === 'convertido') return 'convertido';
  if (lead.status === 'perdido') return 'perdido';
  if (lead.funil_step === 1) return 'novo';
  if (lead.funil_step === 2) return 'data';
  if (lead.funil_step === 3) return 'lugar';
  if (lead.funil_step >= 4) {
    if (lead.followup_count === 1) return 'followup1';
    if (lead.followup_count === 2) return 'followup2';
    if (lead.followup_count >= 3) return 'followup3';
    return 'checkout';
  }
  return 'novo';
}

function getUpdatePayload(colId, lead) {
  let p = {
    lead_id: lead.id,
    funil_step: lead.funil_step,
    status: lead.status !== 'convertido' && lead.status !== 'perdido' ? lead.status : 'novo',
    followup_count: lead.followup_count,
    reason: `Movido para aba: ${COLUMNS.find(c => c.id === colId)?.title}`
  };
  
  if (colId === 'novo') { p.funil_step=1; p.status='novo'; p.followup_count=0; }
  else if (colId === 'data') { p.funil_step=2; p.status='novo'; p.followup_count=0; }
  else if (colId === 'lugar') { p.funil_step=3; p.status='novo'; p.followup_count=0; }
  else if (colId === 'checkout') { p.funil_step=4; p.status='novo'; p.followup_count=0; }
  else if (colId === 'followup1') { p.funil_step=4; p.status='novo'; p.followup_count=1; }
  else if (colId === 'followup2') { p.funil_step=4; p.status='novo'; p.followup_count=2; }
  else if (colId === 'followup3') { p.funil_step=4; p.status='novo'; p.followup_count=3; }
  else if (colId === 'convertido') { p.status='convertido'; }
  else if (colId === 'perdido') { p.status='perdido'; }
  
  return p;
}

export default function KanbanBoard({ initialLeads, onUpdateFilters }) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeLead, setActiveLead] = useState(null);
  const [panelLead, setPanelLead] = useState(null);

  // Sync leads when SWR props change
  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // Realtime Supabase Hook Setup
  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const channel = sb.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Distância previne drags acidentais em cliques
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveLead(leads.find((l) => l.id === active.id));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const leadId = active.id;
    const overId = over.id;

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove) return;

    // Is active over a column or over a card?
    const isOverAColumn = COLUMNS.some(c => c.id === overId);
    let targetColId = overId;
    
    // If over a card, find what column that card belongs to
    if (!isOverAColumn) {
      const overLead = leads.find(l => l.id === overId);
      if (overLead) {
         targetColId = getColumnIdForLead(overLead);
      } else {
         return;
      }
    }

    const currentTargetColId = getColumnIdForLead(leadToMove);
    if (targetColId === currentTargetColId) return;

    // 1. Optimistic Update Local State
    const overridePayload = getUpdatePayload(targetColId, leadToMove);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...overridePayload, updated_at: new Date().toISOString() } : l));

    // 2. Fetch API Update
    try {
      await fetch('/api/admin/leads/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overridePayload)
      });
    } catch(err) {
       console.error("Drag update error", err);
       // Revert or show toast
    }
  };

  const handleWebhookTrigger = async (lead, customMsg) => {
    // Calling N8N Webhook directly (can fail CORS if browser-side, but usually works if it's a generic API route wrapper, we just use fetch raw)
    const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_ABANDONO;
    if (!url) { alert('URL de Webhook não configurada (.env.local)'); return; }
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', // Mute CORS errors typical for n8n missing headers
        body: JSON.stringify({
          lead_id: lead.id,
          nome: lead.nome,
          whatsapp: lead.whatsapp,
          email: lead.email,
          mensagem_customizada: customMsg
        })
      });
      alert('Webhook disparado com sucesso!');
      
      // Update locally + db to next followup step
      const currentFollowup = lead.followup_count || 0;
      if (currentFollowup < 3 && lead.funil_step === 4) {
         const payload = { lead_id: lead.id, status: 'novo', funil_step: 4, followup_count: currentFollowup + 1, reason: `Envio de Mensagem Manual: ${customMsg}` };
         await fetch('/api/admin/leads/upsert', { method: 'POST', body: JSON.stringify(payload) });
      }
      setPanelLead(null);
    } catch(e) {
      alert('Erro disparando webhook: ' + e.message);
    }
  };

  const manualStatusUpdate = async (id, status) => {
     let reasonObj = status === 'convertido' ? { status: 'convertido' } : { status: 'perdido' };
     const payload = { lead_id: id, ...reasonObj, reason: `Lead marcado manualmente como ${status} no CRM` };
     await fetch('/api/admin/leads/upsert', { method: 'POST', body: JSON.stringify(payload) });
     setPanelLead(null);
     setLeads(prev => prev.map(l => l.id === id ? { ...l, ...reasonObj } : l));
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start h-full">
          {COLUMNS.map((col) => (
            <KanbanColumn 
               key={col.id} 
               column={col} 
               leads={leads.filter(l => getColumnIdForLead(l) === col.id)} 
               onCardClick={setPanelLead}
            />
          ))}
        </div>

        {/* Floating preview card while dragging */}
        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <LeadSidePanel 
         isOpen={!!panelLead} 
         lead={panelLead} 
         onClose={() => setPanelLead(null)}
         onWebhookTrigger={handleWebhookTrigger}
         onStatusUpdate={manualStatusUpdate}
      />
    </>
  );
}
