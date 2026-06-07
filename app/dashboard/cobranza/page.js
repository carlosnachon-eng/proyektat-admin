'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

function formatMXN(n) {
  return `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function formatFecha(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

const METODO_ICONS = { efectivo: '💵', transferencia: '🏦', tarjeta: '💳', otro: '📝' }
const TIPO_COLORS = { anticipo: 'bg-blue-500/20 text-blue-400', liquidacion: 'bg-green-500/20 text-green-400' }

export default function CobranzaPage() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pendientes') // pendientes | cobrado | todos
  const [showForm, setShowForm] = useState(false)
  const [cotSelected, setCotSelected] = useState(null)
  const [form, setForm] = useState({ tipo: 'anticipo', monto: '', metodo: 'transferencia', referencia: '', notas: '', registrado_por: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: cots }, { data: pags }] = await Promise.all([
      supabase.from('cotizaciones').select('*').in('estatus', ['enviada', 'aprobada']).order('fecha_evento', { ascending: true }),
      supabase.from('pagos').select('*').order('created_at', { ascending: false }),
    ])
    setCotizaciones(cots || [])
    setPagos(pags || [])
    setLoading(false)
  }

  // Enrich cotizaciones with payment info
  const cotizacionesEnriquecidas = cotizaciones.map(c => {
    const pagosC = pagos.filter(p => p.cotizacion_id === c.id)
    const cobradoAnticipo = pagosC.filter(p => p.tipo === 'anticipo').reduce((a, p) => a + Number(p.monto), 0)
    const cobradoLiquidacion = pagosC.filter(p => p.tipo === 'liquidacion').reduce((a, p) => a + Number(p.monto), 0)
    const totalCobrado = cobradoAnticipo + cobradoLiquidacion
    const pendienteAnticipo = Math.max(0, Number(c.anticipo) - cobradoAnticipo)
    const pendienteLiquidacion = Math.max(0, Number(c.liquidacion) - cobradoLiquidacion)
    const totalPendiente = pendienteAnticipo + pendienteLiquidacion
    const saldado = totalPendiente === 0
    return { ...c, pagosC, cobradoAnticipo, cobradoLiquidacion, totalCobrado, pendienteAnticipo, pendienteLiquidacion, totalPendiente, saldado }
  })

  const pendientes = cotizacionesEnriquecidas.filter(c => !c.saldado)
  const saldadas = cotizacionesEnriquecidas.filter(c => c.saldado)

  const filtered = (tab === 'pendientes' ? pendientes : tab === 'cobrado' ? saldadas : cotizacionesEnriquecidas)
    .filter(c =>
      (c.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.folio || '').toLowerCase().includes(search.toLowerCase())
    )

  const totalPendienteGlobal = pendientes.reduce((a, c) => a + c.totalPendiente, 0)
  const totalCobradoGlobal = cotizacionesEnriquecidas.reduce((a, c) => a + c.totalCobrado, 0)

  const handleRegistrarPago = (cot) => {
    setCotSelected(cot)
    setForm({
      tipo: cot.pendienteAnticipo > 0 ? 'anticipo' : 'liquidacion',
      monto: cot.pendienteAnticipo > 0 ? String(cot.pendienteAnticipo) : String(cot.pendienteLiquidacion),
      metodo: 'transferencia', referencia: '', notas: '', registrado_por: ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.monto || !cotSelected) return
    setSaving(true)
    await supabase.from('pagos').insert({
      cotizacion_id: cotSelected.id,
      tipo: form.tipo,
      monto: parseFloat(form.monto),
      metodo: form.metodo,
      referencia: form.referencia,
      notas: form.notas,
      registrado_por: form.registrado_por,
    })
    setSaving(false)
    setShowForm(false)
    setCotSelected(null)
    fetchData()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cobranza</h1>
          <p className="text-gray-400 text-sm mt-1">{pendientes.length} cobros pendientes</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">Por cobrar</p>
          <p className="text-xl font-bold text-amber-400">{formatMXN(totalPendienteGlobal)}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">Ya cobrado</p>
          <p className="text-xl font-bold text-green-400">{formatMXN(totalCobradoGlobal)}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">Servicios activos</p>
          <p className="text-xl font-bold text-white">{cotizaciones.length}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {[['pendientes','⏳ Pendientes'], ['cobrado','✅ Saldados'], ['todos','📋 Todos']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${tab === key ? 'bg-brand-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`}>
              {label}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Buscar cliente o folio..." value={search} onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 w-56" />
      </div>

      {/* Form Modal */}
      {showForm && cotSelected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-1">Registrar pago</h2>
            <p className="text-gray-400 text-sm mb-5">{cotSelected.cliente_nombre} · {cotSelected.folio}</p>

            {/* Resumen pendiente */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#252525] rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Anticipo pendiente</p>
                <p className={`font-bold ${cotSelected.pendienteAnticipo > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {formatMXN(cotSelected.pendienteAnticipo)}
                </p>
              </div>
              <div className="bg-[#252525] rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Liquidación pendiente</p>
                <p className={`font-bold ${cotSelected.pendienteLiquidacion > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {formatMXN(cotSelected.pendienteLiquidacion)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tipo de pago</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500">
                    <option value="anticipo">Anticipo</option>
                    <option value="liquidacion">Liquidación</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Método</label>
                  <select value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500">
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="otro">📝 Otro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Monto recibido $</label>
                <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Referencia / Comprobante</label>
                <input value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Número de transferencia, folio, etc." />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Registrado por</label>
                <input value={form.registrado_por} onChange={e => setForm({ ...form, registrado_por: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Nombre de quien recibe" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Notas adicionales..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-[#333] text-gray-400 text-sm hover:bg-[#252525] transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.monto}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition disabled:opacity-50">
                {saving ? 'Guardando...' : 'Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {tab === 'pendientes' ? '¡Todo cobrado! 🎉' : 'Sin resultados'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{c.cliente_nombre || 'Sin cliente'}</p>
                    <span className="text-gray-600 text-xs font-mono">{c.folio}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{c.area} {c.fecha_evento ? `· ${formatFecha(c.fecha_evento + 'T12:00:00')}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{formatMXN(c.monto_total)}</p>
                  {c.saldado ? (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✅ Saldado</span>
                  ) : (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">⏳ Pendiente</span>
                  )}
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Anticipo</span>
                    <span>{formatMXN(c.cobradoAnticipo)} / {formatMXN(c.anticipo)}</span>
                  </div>
                  <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, c.anticipo > 0 ? (c.cobradoAnticipo / c.anticipo) * 100 : 0)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Liquidación</span>
                    <span>{formatMXN(c.cobradoLiquidacion)} / {formatMXN(c.liquidacion)}</span>
                  </div>
                  <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, c.liquidacion > 0 ? (c.cobradoLiquidacion / c.liquidacion) * 100 : 0)}%` }} />
                  </div>
                </div>
              </div>

              {/* Pagos registrados */}
              {c.pagosC.length > 0 && (
                <div className="mb-3 space-y-1">
                  {c.pagosC.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-[#252525] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{METODO_ICONS[p.metodo]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${TIPO_COLORS[p.tipo]}`}>{p.tipo}</span>
                        {p.registrado_por && <span className="text-xs text-gray-500">{p.registrado_por}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 text-sm font-semibold">{formatMXN(p.monto)}</span>
                        <p className="text-gray-600 text-xs">{formatFecha(p.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!c.saldado && (
                <button onClick={() => handleRegistrarPago(c)}
                  className="w-full py-2 rounded-xl bg-brand-600/20 text-brand-400 text-sm font-medium hover:bg-brand-600/30 transition border border-brand-600/30">
                  + Registrar pago
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
