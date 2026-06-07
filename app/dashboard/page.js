'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

function formatMXN(n) {
  return `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function formatFecha(str) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ESTATUS_COLORS = {
  borrador:  'bg-gray-500/20 text-gray-400',
  enviada:   'bg-blue-500/20 text-blue-400',
  aprobada:  'bg-green-500/20 text-green-400',
  rechazada: 'bg-red-500/20 text-red-400',
  cancelada: 'bg-orange-500/20 text-orange-400',
}

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // KPIs
  const [totalClientes, setTotalClientes] = useState(0)
  const [cotizacionesMes, setCotizacionesMes] = useState([])
  const [eventosProximos, setEventosProximos] = useState([])
  const [cobranzaPendiente, setCobranzaPendiente] = useState({ anticipos: 0, liquidaciones: 0 })
  const [ultimosClientes, setUltimosClientes] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user)
    })
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
    const hoy = now.toISOString().split('T')[0]

    const [
      { count: clientes },
      { data: cotMes },
      { data: eventos },
      { data: cobranza },
      { data: recientes },
    ] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('cotizaciones').select('*').gte('created_at', inicioMes).lte('created_at', finMes),
      supabase.from('cotizaciones').select('*').gte('fecha_evento', hoy).not('fecha_evento', 'is', null).neq('estatus', 'cancelada').order('fecha_evento', { ascending: true }).limit(5),
      supabase.from('cotizaciones').select('anticipo, liquidacion, estatus').in('estatus', ['enviada', 'aprobada']),
      supabase.from('clientes').select('*').eq('activo', true).order('created_at', { ascending: false }).limit(4),
    ])

    setTotalClientes(clientes || 0)
    setCotizacionesMes(cotMes || [])
    setEventosProximos(eventos || [])

    const pendiente = (cobranza || []).reduce((acc, c) => ({
      anticipos: acc.anticipos + (Number(c.anticipo) || 0),
      liquidaciones: acc.liquidaciones + (Number(c.liquidacion) || 0),
    }), { anticipos: 0, liquidaciones: 0 })
    setCobranzaPendiente(pendiente)
    setUltimosClientes(recientes || [])
    setLoading(false)
  }

  const montoMes = cotizacionesMes.reduce((a, c) => a + (Number(c.monto_total) || 0), 0)
  const aprobadas = cotizacionesMes.filter(c => c.estatus === 'aprobada').length
  const pendientes = cotizacionesMes.filter(c => ['borrador', 'enviada'].includes(c.estatus)).length

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-white mt-1">Dashboard</h1>
        {user && <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-2xl font-bold text-white">{totalClientes}</p>
          <p className="text-xs text-gray-500 mt-1">Clientes activos</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <p className="text-2xl mb-2">📄</p>
          <p className="text-2xl font-bold text-white">{cotizacionesMes.length}</p>
          <p className="text-xs text-gray-500 mt-1">Cotizaciones este mes</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">{aprobadas} aprobadas</span>
            <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">{pendientes} pendientes</span>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <p className="text-2xl mb-2">💰</p>
          <p className="text-xl font-bold text-white">{formatMXN(montoMes)}</p>
          <p className="text-xs text-gray-500 mt-1">Monto cotizado este mes</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
          <p className="text-2xl mb-2">⏳</p>
          <p className="text-xl font-bold text-amber-400">{formatMXN(cobranzaPendiente.liquidaciones)}</p>
          <p className="text-xs text-gray-500 mt-1">Liquidaciones por cobrar</p>
          <p className="text-xs text-green-400 mt-1">Anticipos: {formatMXN(cobranzaPendiente.anticipos)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Eventos próximos */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">📅 Eventos próximos</h2>
            <a href="/dashboard/cotizaciones" className="text-xs text-brand-400 hover:underline">Ver todos</a>
          </div>
          {eventosProximos.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No hay eventos próximos</p>
          ) : (
            <div className="space-y-3">
              {eventosProximos.map(e => {
                const diasRestantes = Math.ceil((new Date(e.fecha_evento + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{e.cliente_nombre || 'Sin cliente'}</p>
                      <p className="text-gray-500 text-xs">{e.area} · {formatFecha(e.fecha_evento)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${diasRestantes <= 3 ? 'bg-red-500/20 text-red-400' : diasRestantes <= 7 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                        {diasRestantes === 0 ? '¡Hoy!' : diasRestantes === 1 ? 'Mañana' : `${diasRestantes} días`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimas cotizaciones */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">📄 Últimas cotizaciones</h2>
            <a href="/dashboard/cotizaciones" className="text-xs text-brand-400 hover:underline">Ver todas</a>
          </div>
          {cotizacionesMes.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Sin cotizaciones este mes</p>
          ) : (
            <div className="space-y-3">
              {cotizacionesMes.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{c.cliente_nombre || 'Sin cliente'}</p>
                    <p className="text-gray-500 text-xs">{c.area} · <span className="font-mono">{c.folio}</span></p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-white text-sm font-semibold">{formatMXN(c.monto_total)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ESTATUS_COLORS[c.estatus]}`}>{c.estatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos clientes */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">👥 Últimos clientes</h2>
            <a href="/dashboard/clientes" className="text-xs text-brand-400 hover:underline">Ver todos</a>
          </div>
          {ultimosClientes.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Sin clientes registrados</p>
          ) : (
            <div className="space-y-3">
              {ultimosClientes.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-[#222] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{c.nombre}</p>
                    <p className="text-gray-500 text-xs">{c.empresa || c.correo || c.telefono || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen por área */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">📊 Cotizaciones por área (este mes)</h2>
          {cotizacionesMes.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Sin datos este mes</p>
          ) : (() => {
            const porArea = cotizacionesMes.reduce((acc, c) => {
              acc[c.area] = (acc[c.area] || 0) + 1
              return acc
            }, {})
            const max = Math.max(...Object.values(porArea))
            return (
              <div className="space-y-3">
                {Object.entries(porArea).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
                  <div key={area}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{area}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
                      <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

      </div>
    </div>
  )
}
