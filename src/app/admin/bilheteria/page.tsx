'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Espetaculo {
  id: string
  nome: string
  data_hora: string
  cidade: string
  status: string
}

interface Setor {
  id: string
  nome: string
  preco_inteira: number
  preco_meia: number
}

interface TicketImpresso {
  pedidoId: string
  codigo: string
  nome: string
  espetaculo: string
  data: string
  setor: string
  tipo: string
  quantidade: number
  total: number
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BilheteriaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [espetaculos, setEspetaculos] = useState<Espetaculo[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [espetaculoId, setEspetaculoId] = useState('')
  const [setorId, setSetorId] = useState('')
  const [tipo, setTipo] = useState<'inteira' | 'meia'>('inteira')
  const [quantidade, setQuantidade] = useState(1)
  const [nomeCliente, setNomeCliente] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState<TicketImpresso | null>(null)

  const [vendasHoje, setVendasHoje] = useState({ qtd: 0, total: 0 })

  useEffect(() => {
    load()
    loadVendasHoje()
  }, [])

  async function load() {
    const { data: eventos } = await supabase
      .from('espetaculos')
      .select('id, nome, data_hora, cidade, status')
      .eq('status', 'publicado')
      .order('data_hora', { ascending: true })
    setEspetaculos(eventos || [])
    if (eventos && eventos.length > 0) setEspetaculoId(eventos[0].id)

    const { data: setoresData } = await supabase
      .from('setores')
      .select('id, nome, preco_inteira, preco_meia')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
    setSetores(setoresData || [])
    if (setoresData && setoresData.length > 0) setSetorId(setoresData[0].id)
  }

  async function loadVendasHoje() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('pedidos')
      .select('total')
      .eq('canal', 'bilheteria')
      .gte('created_at', today.toISOString())
    const qtd = data?.length || 0
    const total = (data || []).reduce((s, p) => s + Number(p.total), 0)
    setVendasHoje({ qtd, total })
  }

  const setor = setores.find((s) => s.id === setorId)
  const preco = setor ? (tipo === 'meia' ? setor.preco_meia : setor.preco_inteira) : 0
  const totalVenda = preco * quantidade

  async function handleVender() {
    if (!setor || !espetaculoId || !nomeCliente.trim()) {
      setError('Preencha o nome do cliente e selecione o ingresso.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const espetaculo = espetaculos.find((e) => e.id === espetaculoId)

      const { data: pedido, error: pedidoErr } = await supabase
        .from('pedidos')
        .insert({
          espetaculo_id: espetaculoId,
          nome_cliente: nomeCliente.trim(),
          status: 'pago',
          total: totalVenda,
          canal: 'bilheteria',
          forma_pagamento: formaPagamento,
        })
        .select('id')
        .single()

      if (pedidoErr || !pedido) throw pedidoErr

      await supabase.from('pedido_itens').insert({
        pedido_id: pedido.id,
        setor_id: setor.id,
        tipo,
        quantidade,
        preco_unitario: preco,
        subtotal: totalVenda,
      })

      setTicket({
        pedidoId: pedido.id,
        codigo: `RKM-${pedido.id.slice(0, 4)}-${pedido.id.slice(4, 8)}`.toUpperCase(),
        nome: nomeCliente.trim(),
        espetaculo: espetaculo?.nome || '',
        data: espetaculo?.data_hora || '',
        setor: setor.nome,
        tipo,
        quantidade,
        total: totalVenda,
      })

      setNomeCliente('')
      setQuantidade(1)
      loadVendasHoje()
    } catch (err) {
      console.error(err)
      setError('Erro ao registrar venda. Tente novamente.')
    }
    setLoading(false)
  }

  function handlePrint() {
    window.print()
  }

  function handleNovaVenda() {
    setTicket(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const qrUrl = ticket
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`RAKMER:${ticket.pedidoId}`)}&size=180x180&bgcolor=ffffff&color=000000&margin=8`
    : ''

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — hidden on print */}
      <header className="print:hidden flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900 text-white">
        <div>
          <h1 className="font-bold text-lg">🎫 Bilheteria</h1>
          <p className="text-slate-400 text-xs">
            Hoje: {vendasHoje.qtd} venda{vendasHoje.qtd !== 1 ? 's' : ''} — {formatPrice(vendasHoje.total)}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Sair
        </button>
      </header>

      <div className="print:hidden max-w-lg mx-auto px-4 py-6">
        {!ticket ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Sessão</label>
              <select
                value={espetaculoId}
                onChange={(e) => setEspetaculoId(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-rose-400"
              >
                {espetaculos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {new Date(e.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} •{' '}
                    {new Date(e.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} —{' '}
                    {e.cidade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Setor</label>
              <div className="grid grid-cols-1 gap-2">
                {setores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSetorId(s.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      setorId === s.id ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
                    }`}
                  >
                    <span className="font-semibold text-slate-800 text-sm">{s.nome}</span>
                    <span className="text-xs text-slate-500">
                      {formatPrice(s.preco_inteira)} / {formatPrice(s.preco_meia)} meia
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipo</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  <button
                    onClick={() => setTipo('inteira')}
                    className={`flex-1 py-2.5 text-sm font-semibold ${tipo === 'inteira' ? 'bg-rose-600 text-white' : 'bg-white text-slate-500'}`}
                  >
                    Inteira
                  </button>
                  <button
                    onClick={() => setTipo('meia')}
                    className={`flex-1 py-2.5 text-sm font-semibold ${tipo === 'meia' ? 'bg-rose-600 text-white' : 'bg-white text-slate-500'}`}
                  >
                    Meia
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Quantidade</label>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl px-2">
                  <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))} className="w-9 h-9 text-lg font-bold text-slate-600">−</button>
                  <span className="font-bold text-slate-800">{quantidade}</span>
                  <button onClick={() => setQuantidade((q) => Math.min(20, q + 1))} className="w-9 h-9 text-lg font-bold text-slate-600">+</button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nome do cliente</label>
              <input
                type="text"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Nome completo"
                className="w-full px-3 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Forma de pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {(['dinheiro', 'cartao', 'pix'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormaPagamento(f)}
                    className={`py-2.5 rounded-xl text-xs font-bold capitalize ${
                      formaPagamento === f ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">⚠ {error}</p>}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500 text-sm">Total</span>
              <span className="font-bold text-2xl text-slate-900">{formatPrice(totalVenda)}</span>
            </div>

            <button
              onClick={handleVender}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Registrando...' : `Confirmar Venda — ${formatPrice(totalVenda)}`}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="font-bold text-xl text-slate-900 mb-1">Venda registrada!</h2>
            <p className="text-slate-500 text-sm mb-6">{ticket.nome} — {ticket.codigo}</p>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={handleNovaVenda}
                className="flex-1 py-3.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
              >
                Nova Venda
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable ticket — only visible when printing */}
      {ticket && (
        <div className="hidden print:block print-ticket" style={{ width: '80mm', padding: '4mm', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <p style={{ fontWeight: 'bold', fontSize: 14 }}>🎪 CIRCO RAKMER</p>
            <p style={{ fontSize: 10 }}>{ticket.espetaculo}</p>
          </div>
          <hr style={{ border: '1px dashed #000', margin: '6px 0' }} />
          <p style={{ fontSize: 11 }}>Cliente: {ticket.nome}</p>
          {ticket.data && (
            <p style={{ fontSize: 11 }}>
              Data: {new Date(ticket.data).toLocaleDateString('pt-BR')} {new Date(ticket.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <p style={{ fontSize: 11 }}>Setor: {ticket.setor} ({ticket.tipo === 'meia' ? 'Meia' : 'Inteira'})</p>
          <p style={{ fontSize: 11 }}>Quantidade: {ticket.quantidade}</p>
          <p style={{ fontSize: 11, fontWeight: 'bold' }}>Total: {formatPrice(ticket.total)}</p>
          <hr style={{ border: '1px dashed #000', margin: '6px 0' }} />
          <div style={{ textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR" width={140} height={140} />
            <p style={{ fontSize: 10, marginTop: 4 }}>{ticket.codigo}</p>
          </div>
        </div>
      )}
    </div>
  )
}
