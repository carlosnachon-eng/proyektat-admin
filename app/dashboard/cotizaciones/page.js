'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { generarCotizacionPDF } from '@/lib/generarCotizacionPDF'

const AREAS = ['Fotografía', 'Video', 'Eventos', 'Transmisiones', 'Circuito Cerrado', 'Marketing', 'Audio']

const SERVICIOS_POR_AREA = {
  'Fotografía':        ['Social', 'Producto', 'Empresarial', 'Identificación', 'Escolar', 'Publicitaria', 'Inmobiliaria', 'Retrato'],
  'Video':             ['Social', 'Empresarial', 'Inmobiliario', 'Publicitario', 'Aéreo', 'Escolar'],
  'Eventos':           ['Evento social', 'Evento cultural', 'Evento empresarial', 'Toma de protesta', 'Premiación', 'Inauguración', 'Renta de escenario', 'Renta de mobiliario', 'Catering', 'Mesa de dulces'],
  'Transmisiones':     ['Transmisión en directo', 'Evento e inauguración', 'Falso en vivo', 'Podcast', 'Deportiva', 'Escolar'],
  'Circuito Cerrado':  ['Inauguración', 'Presentación', 'Evento social', 'Conferencia', 'Auditorio', 'Evento deportivo'],
  'Marketing':         ['Estudio de mercado', 'Diseño', 'Brandeo', 'Impresiones', 'Espectacular', 'Valla', 'Forrado de automóvil', 'Desarrollo de marca'],
  'Audio':             ['Renta de audio', 'Renta de pantallas', 'DJ', 'Cantante', 'Grupo', 'Karaoke', 'Locución', 'Traducción simultánea'],
}

const ESTATUS_COLORS = {
  borrador:   'bg-gray-500/20 text-gray-400',
  enviada:    'bg-blue-500/20 text-blue-400',
  aprobada:   'bg-green-500/20 text-green-400',
  rechazada:  'bg-red-500/20 text-red-400',
  cancelada:  'bg-orange-500/20 text-orange-400',
}

const empty = {
  cliente_id: '', cliente_nombre: '', area: 'Fotografía', servicios: [],
  descripcion: '', monto_total: '', anticipo: '', fecha_evento: '', estatus: 'borrador', notas: ''
}

function getPadded(n) { return String(n).padStart(4, '0') }

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)

  useEffect(() => { fetchCotizaciones(); fetchClientes() }, [])

  const fetchCotizaciones = async () => {
    setLoading(true)
    const { data } = await supabase.from('cotizaciones').select('*').order('created_at', { ascending: false })
    setCotizaciones(data || [])
    setLoading(false)
  }

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nombre, empresa').eq('activo', true).order('nombre')
    setClientes(data || [])
  }

  const nextFolio = () => `COT-${new Date().getFullYear()}-${getPadded(cotizaciones.length + 1)}`

  const toggleServicio = (s) => {
    const current = form.servicios || []
    setForm({ ...form, servicios: current.includes(s) ? current.filter(x => x !== s) : [...current, s] })
  }

  const calcLiquidacion = () => {
    const total = parseFloat(form.monto_total) || 0
    const ant = parseFloat(form.anticipo) || 0
    return Math.max(0, total - ant).toFixed(2)
  }

  const handleSave = async () => {
    if (!form.area) return
    setSaving(true)
    const payload = {
      ...form,
      liquidacion: parseFloat(calcLiquidacion()),
      monto_total: parseFloat(form.monto_total) || 0,
      anticipo: parseFloat(form.anticipo) || 0,
      fecha_evento: form.fecha_evento || null,
    }
    if (editing) {
      await supabase.from('cotizaciones').update(payload).eq('id', editing)
    } else {
      await supabase.from('cotizaciones').insert({ ...payload, folio: nextFolio() })
    }
    setSaving(false)
    setShowForm(false)
    setEditing(null)
    setForm(empty)
    fetchCotizaciones()
  }

  const handleEdit = (c) => {
    setForm({
      cliente_id: c.cliente_id || '', cliente_nombre: c.cliente_nombre || '',
      area: c.area, servicios: c.servicios || [], descripcion: c.descripcion || '',
      monto_total: c.monto_total || '', anticipo: c.anticipo || '',
      fecha_evento: c.fecha_evento || '', estatus: c.estatus, notas: c.notas || '',
    })
    setClienteSearch(c.cliente_nombre || '')
    setEditing(c.id)
    setSelected(null)
    setShowForm(true)
  }

  const handleCancel = () => { setShowForm(false); setEditing(null); setForm(empty); setClienteSearch('') }

  const handleSelectCliente = (c) => {
    setForm({ ...form, cliente_id: c.id, cliente_nombre: c.nombre })
    setClienteSearch(c.nombre)
    setShowClienteDropdown(false)
  }

  const filtered = cotizaciones.filter(c =>
    (c.folio || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.area || '').toLowerCase().includes(search.toLowerCase())
  )

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    (c.empresa || '').toLowerCase().includes(clienteSearch.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cotizaciones</h1>
          <p className="text-gray-400 text-sm mt-1">{cotizaciones.length} cotizaciones registradas</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); setClienteSearch('') }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition">
          <span>+</span> Nueva cotización
        </button>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Buscar por folio, cliente o área..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm" />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl p-6 my-4">
            <h2 className="text-lg font-bold text-white mb-5">
              {editing ? 'Editar cotización' : `Nueva cotización · ${nextFolio()}`}
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs text-gray-400 mb-1 block">Cliente</label>
                <input value={clienteSearch}
                  onChange={e => { setClienteSearch(e.target.value); setForm({ ...form, cliente_nombre: e.target.value, cliente_id: '' }); setShowClienteDropdown(true) }}
                  onFocus={() => setShowClienteDropdown(true)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Buscar cliente registrado o escribir nombre..." />
                {showClienteDropdown && clienteSearch && clientesFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-[#252525] border border-[#333] rounded-xl mt-1 z-10 max-h-40 overflow-y-auto">
                    {clientesFiltrados.map(c => (
                      <button key={c.id} onClick={() => handleSelectCliente(c)}
                        className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2a2a2a] transition">
                        <span className="font-medium">{c.nombre}</span>
                        {c.empresa && <span className="text-gray-400 ml-2">· {c.empresa}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Área de servicio</label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map(a => (
                    <button key={a} onClick={() => setForm({ ...form, area: a, servicios: [] })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${form.area === a ? 'bg-brand-600 text-white' : 'bg-[#252525] text-gray-400 hover:bg-[#2a2a2a]'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Servicios incluidos</label>
                <div className="flex flex-wrap gap-2">
                  {(SERVICIOS_POR_AREA[form.area] || []).map(s => (
                    <button key={s} onClick={() => toggleServicio(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition ${(form.servicios || []).includes(s) ? 'bg-brand-600/30 text-brand-300 border border-brand-600' : 'bg-[#252525] text-gray-400 hover:bg-[#2a2a2a] border border-transparent'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Descripción del servicio</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Detalles del servicio..." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Monto total $</label>
                  <input type="number" value={form.monto_total} onChange={e => setForm({ ...form, monto_total: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Anticipo $</label>
                  <input type="number" value={form.anticipo} onChange={e => setForm({ ...form, anticipo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Liquidación $</label>
                  <input readOnly value={calcLiquidacion()}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#333] text-gray-400 text-sm cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Fecha del evento</label>
                  <input type="date" value={form.fecha_evento} onChange={e => setForm({ ...form, fecha_evento: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Estatus</label>
                  <select value={form.estatus} onChange={e => setForm({ ...form, estatus: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500">
                    {['borrador','enviada','aprobada','rechazada','cancelada'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas internas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Notas internas..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl border border-[#333] text-gray-400 text-sm hover:bg-[#252525] transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition disabled:opacity-50">
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cotización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 font-mono">{selected.folio}</p>
                <h2 className="text-lg font-bold text-white mt-1">{selected.cliente_nombre || 'Sin cliente'}</h2>
                <p className="text-gray-400 text-sm">{selected.area}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ESTATUS_COLORS[selected.estatus]}`}>
                {selected.estatus}
              </span>
            </div>

            {selected.servicios?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selected.servicios.map(s => (
                  <span key={s} className="text-xs px-2 py-1 bg-[#252525] text-gray-300 rounded-lg">{s}</span>
                ))}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-[#222]">
                <span className="text-gray-500">Total</span>
                <span className="text-white font-semibold">${Number(selected.monto_total).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222]">
                <span className="text-gray-500">Anticipo</span>
                <span className="text-green-400">${Number(selected.anticipo).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222]">
                <span className="text-gray-500">Liquidación</span>
                <span className="text-amber-400">${Number(selected.liquidacion).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
              </div>
              {selected.fecha_evento && (
                <div className="flex justify-between py-2 border-b border-[#222]">
                  <span className="text-gray-500">Fecha evento</span>
                  <span className="text-white">{new Date(selected.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX', {day:'numeric', month:'long', year:'numeric'})}</span>
                </div>
              )}
              {selected.descripcion && (
                <div className="py-2">
                  <p className="text-gray-500 mb-1">Descripción</p>
                  <p className="text-gray-300 text-xs">{selected.descripcion}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="py-2.5 px-4 rounded-xl border border-[#333] text-gray-400 text-sm hover:bg-[#252525] transition">Cerrar</button>
              <button onClick={() => handleEdit(selected)} className="py-2.5 px-4 rounded-xl bg-[#252525] text-white text-sm hover:bg-[#2a2a2a] transition">✏️ Editar</button>
              <button onClick={() => generarCotizacionPDF(selected)}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
                📄 Descargar PDF
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
          {search ? 'No se encontraron resultados' : 'Aún no hay cotizaciones registradas'}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#3a3a3a] cursor-pointer transition">
              <div className="flex items-center gap-4">
                <div className="hidden md:flex w-10 h-10 rounded-full bg-brand-600/20 items-center justify-center text-brand-400 font-bold text-xs">
                  {c.area?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{c.cliente_nombre || 'Sin cliente'}</p>
                    <span className="text-gray-600 text-xs font-mono">{c.folio}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{c.area}{c.fecha_evento ? ` · ${new Date(c.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX')}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-semibold">${Number(c.monto_total).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ESTATUS_COLORS[c.estatus]}`}>{c.estatus}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
