'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const areas = [
  { label: 'Fotografía',    icon: '📷', color: 'from-pink-500 to-rose-600',     href: '/dashboard/fotografia' },
  { label: 'Video',         icon: '🎬', color: 'from-red-500 to-orange-600',    href: '/dashboard/video' },
  { label: 'Eventos',       icon: '🎪', color: 'from-amber-500 to-yellow-600',  href: '/dashboard/eventos' },
  { label: 'Transmisiones', icon: '📡', color: 'from-blue-500 to-cyan-600',     href: '/dashboard/transmisiones' },
  { label: 'Cir. Cerrado',  icon: '🔒', color: 'from-slate-500 to-gray-600',    href: '/dashboard/circuito' },
  { label: 'Marketing',     icon: '📢', color: 'from-green-500 to-emerald-600', href: '/dashboard/marketing' },
  { label: 'Audio',         icon: '🎵', color: 'from-purple-500 to-violet-600', href: '/dashboard/audio' },
]

export default function DashboardPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user)
    })
  }, [])

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-white mt-1">
          Bienvenido a ProyektatAdmin 👋
        </h1>
        {user && (
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
        )}
      </div>

      {/* KPI cards placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Cotizaciones activas', value: '—', icon: '📄' },
          { label: 'Eventos este mes',     value: '—', icon: '📅' },
          { label: 'Clientes totales',     value: '—', icon: '👥' },
          { label: 'Cobranza pendiente',   value: '—', icon: '💰' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <p className="text-2xl mb-2">{kpi.icon}</p>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Areas grid */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Áreas de servicio
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {areas.map((area) => (
          <a
            key={area.label}
            href={area.href}
            className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] hover:bg-[#1e1e1e] transition-all cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${area.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
              {area.icon}
            </div>
            <p className="text-white font-semibold text-sm">{area.label}</p>
            <p className="text-gray-500 text-xs mt-1">Ver módulo →</p>
          </a>
        ))}
      </div>
    </div>
  )
}
