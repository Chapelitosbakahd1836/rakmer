// @ts-nocheck
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard from './LeadCard';
import { cn } from './LeadCard';

export default function KanbanColumn({ column, leads, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const count = leads.length;
  // If count is > 10 in sensitive columns, red badge.
  const isSensitive = column.id === 'checkout' || column.id === 'followup3';
  const badgeColor = isSensitive && count > 10 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700';

  return (
    <div className="flex flex-col bg-slate-50 rounded-xl w-[280px] shrink-0 max-h-[calc(100vh-180px)] overflow-hidden border border-slate-200 shadow-sm">
      
      {/* Column Header */}
      <div className="p-3 bg-white border-b border-slate-200 flex justify-between items-center z-10 sticky top-0">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          {column.icon} {column.title}
        </h3>
        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", badgeColor)}>
          {count}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[150px] transition-colors",
          isOver ? "bg-slate-100/80 ring-2 ring-primary/20 ring-inset" : ""
        )}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
          ))}
        </SortableContext>
        
        {leads.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-4 italic">
            Nenhum lead
          </div>
        )}
      </div>

    </div>
  );
}
