// @ts-nocheck
import React, { useState } from 'react';
import { X, ExternalLink, MessageCircle, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LeadSidePanel({ lead, isOpen, onClose, onWebhookTrigger, onStatusUpdate }) {
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen || !lead) return null;

  const handleSendWebhook = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    await onWebhookTrigger(lead, msgText);
    setMsgText('');
    setSending(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 z-40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col overflow-hidden border-l border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
              {lead.nome?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 leading-tight">{lead.nome || 'Desconhecido'}</h2>
              <span className="text-xs text-slate-500 font-medium">#{lead.id.split('-')[0]} • Status: {lead.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-6">
          
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contato</span>
              <p className="text-sm font-semibold text-slate-700 break-all">{lead.whatsapp || '--'}</p>
              <p className="text-xs text-slate-500 truncate">{lead.email || '--'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Interesse</span>
              <p className="text-sm font-semibold text-slate-700 truncate">{lead.espetaculo?.nome || 'Não definido'}</p>
              <p className="text-xs text-slate-500 capitalize">Origem: {lead.utm_source || 'Desconhecida'}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button 
              onClick={() => onStatusUpdate(lead.id, 'convertido')}
              className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 size={16} /> Convertido
            </button>
            <button 
              onClick={() => onStatusUpdate(lead.id, 'perdido')}
              className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle size={16} /> Perdido
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* Webhook Message Section */}
          <div>
            <h3 className="font-bold border-l-4 border-primary pl-2 text-slate-800 mb-3 flex items-center gap-2">
              <MessageCircle size={16} className="text-primary"/> Enviar Mensagem (Webhook)
            </h3>
            <div className="flex flex-col gap-2">
              <textarea 
                rows={3}
                placeholder="Exibições de remarketing personalizadas aqui..."
                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
              />
              <button 
                onClick={handleSendWebhook}
                disabled={sending || !msgText.trim()}
                className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {sending ? 'Enviando ao n8n...' : <><Send size={15}/> Disparar Agora</>}
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Mini History Timeline */}
          <div>
            <h3 className="font-bold border-l-4 border-slate-400 pl-2 text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-slate-500"/> Timeline
            </h3>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-4">
              <div className="relative pl-4">
                <div className="absolute w-3 h-3 bg-slate-400 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                <p className="text-xs text-slate-500 mb-0.5">{format(new Date(lead.updated_at), "dd/MM 'às' HH:mm", {locale: ptBR})}</p>
                <p className="text-sm text-slate-700 font-medium">Última alteração no CRM</p>
                <p className="text-xs text-slate-500">Step: {lead.funil_step} - {lead.status}</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute w-3 h-3 bg-slate-200 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                <p className="text-xs text-slate-500 mb-0.5">{format(new Date(lead.created_at), "dd/MM 'às' HH:mm", {locale: ptBR})}</p>
                <p className="text-sm text-slate-700 font-medium">Lead Criado</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-slate-50 border-t border-slate-200 mt-auto">
          <a href={lead.cliente_id ? `/admin/clientes/${lead.cliente_id}` : '#'} 
             className="w-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
            <ExternalLink size={15}/> Ver Perfil Completo
          </a>
        </div>
      </div>
    </>
  );
}
