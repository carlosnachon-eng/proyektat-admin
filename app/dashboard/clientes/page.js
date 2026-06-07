'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

const TIPOS = ['social', 'empresarial', 'escolar', 'otro']

const TIPO_COLORS = {
  social:      'bg-pink-500/20 text-pink-400',
  empresarial: 'bg-blue-500/20 text-blue-400',
  escolar:     'bg-amber-500/20 text-amber-400',
  otro:        'bg-gray-500/20 text-gray-400',
}

const empty = { nombre: '', telefono: '', correo: '', empresa: '', tipo: 'social', notas: '' }

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchClientes() }, [])

  const fetchClientes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.empresa || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search)
  )

  const handleSave = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from('clientes').update(form).eq('id', editing)
    } else {
      await supabase.from('clientes').insert(form)
    }
    setSaving(false)
    setShowForm(false)
    setEditing(null)
    setForm(empty)
    fetchClientes()
  }

  const handleEdit = (c) => {
    setForm({ nombre: c.nombre, telefono: c.telefono || '', correo: c.correo || '', empresa: c.empresa || '', tipo: c.tipo || 'social', notas: c.notas || '' })
    setEditing(c.id)
    setSelected(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await supabase.from('clientes').update({ activo: false }).eq('id', id)
    setSelected(null)
    fetchClientes()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditing(null)
    setForm(empty)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(empty) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition"
        >
          <span>+</span> Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, empresa o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-white mb-5">
              {editing ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nombre completo *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="222 000 0000"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Correo</label>
                  <input
                    value={form.correo}
                    onChange={e => setForm({ ...form, correo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Empresa / Organización</label>
                  <input
                    value={form.empresa}
                    onChange={e => setForm({ ...form, empresa: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tipo de cliente</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#252525] border border-[#333] text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl border border-[#333] text-gray-400 text-sm hover:bg-[#252525] transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.nombre.trim()} className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition disabled:opacity-50">
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}
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
                <h2 className="text-lg font-bold text-white">{selected.nombre}</h2>
                {selected.empresa && <p className="text-gray-400 text-sm">{selected.empresa}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${TIPO_COLORS[selected.tipo] || TIPO_COLORS.otro}`}>
                {selected.tipo}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              {selected.telefono && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-20">Teléfono</span>
                  <a href={`tel:${selected.telefono}`} className="text-brand-400 hover:underline">{selected.telefono}</a>
                </div>
              )}
              {selected.correo && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-20">Correo</span>
                  <a href={`mailto:${selected.correo}`} className="text-brand-400 hover:underline">{selected.correo}</a>
                </div>
              )}
              {selected.notas && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-20">Notas</span>
                  <p className="text-gray-300 flex-1">{selected.notas}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-20">Registro</span>
                <span className="text-gray-300">{new Date(selected.created_at).toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl border border-[#333] text-gray-400 text-sm hover:bg-[#252525] transition">
                Cerrar
              </button>
              <button onClick={() => handleEdit(selected)} className="flex-1 py-2.5 rounded-xl bg-[#252525] text-white text-sm hover:bg-[#2a2a2a] transition">
                ✏️ Editar
              </button>
              <button onClick={() => { if(confirm('¿Eliminar este cliente?')) handleDelete(selected.id) }} className="py-2.5 px-4 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition">
                🗑️
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
          {search ? 'No se encontraron resultados' : 'Aún no hay clientes registrados'}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#3a3a3a] cursor-pointer transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{c.nombre}</p>
                  <p className="text-gray-500 text-xs">{c.empresa || c.correo || c.telefono || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {c.telefono && (
                  <span className="text-gray-400 text-xs hidden md:block">{c.telefono}</span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${TIPO_COLORS[c.tipo] || TIPO_COLORS.otro}`}>
                  {c.tipo}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
