// @ts-nocheck
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Globe, AlertTriangle, MoreVertical } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LeadCard({ lead, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // When dragging, decrease opacity and scale up slightly
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const initial = lead.nome ? lead.nome.charAt(0).toUpperCase() : '?';
  
  // Calculate time since last update
  const updatedDate = new Date(lead.updated_at);
  const timeStr = formatDistanceToNow(updatedDate, { addSuffix: true, locale: ptBR });
  
  // High urgency if > 24 hours
  const hoursSinceUpdate = (new Date().getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
  const isUrgente = hoursSinceUpdate > 24;

  const isWhatsapp = lead.utm_source?.toLowerCase().includes('whatsapp');
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent default drag trigger if we just wanted to click
        onClick(lead);
      }}
      className={cn(
        "bg-white border select-none sm:select-text rounded-lg p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all flex flex-col gap-2 relative group",
        isDragging && "shadow-xl ring-2 ring-primary border-primary",
        isUrgente && "border-amber-300 bg-amber-50/10"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="flex flex-col overflow-hidden max-w-[150px]">
            <span className="font-semibold text-sm text-slate-900 truncate" title={lead.nome}>{lead.nome || lead.whatsapp || "Desconhecido"}</span>
            <span className="text-xs text-slate-500 font-medium truncate">{lead.espetaculo?.nome || ''}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          {timeStr}
          {isUrgente && <AlertTriangle size={12} className="text-amber-500 ml-1" title="Mais de 24h sem ação" />}
        </span>

        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
          isWhatsapp ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
        )}>
          {isWhatsapp ? <MessageCircle size={10} /> : <Globe size={10} />}
          {isWhatsapp ? "WPP" : "Site"}
        </span>
      </div>
    </div>
  );
}
