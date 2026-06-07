'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

const navItems = [
  { label: 'Dashboard',      href: '/dashboard',                icon: '📊' },
  { label: 'Fotografía',     href: '/dashboard/fotografia',     icon: '📷' },
  { label: 'Video',          href: '/dashboard/video',          icon: '🎬' },
  { label: 'Eventos',        href: '/dashboard/eventos',        icon: '🎪' },
  { label: 'Transmisiones',  href: '/dashboard/transmisiones',  icon: '📡' },
  { label: 'Cir. Cerrado',   href: '/dashboard/circuito',       icon: '🔒' },
  { label: 'Marketing',      href: '/dashboard/marketing',      icon: '📢' },
  { label: 'Audio',          href: '/dashboard/audio',          icon: '🎵' },
  { divider: true },
  { label: 'Clientes',       href: '/dashboard/clientes',       icon: '👥' },
  { label: 'Cotizaciones',   href: '/dashboard/cotizaciones',   icon: '📄' },
  { label: 'Agenda',         href: '/dashboard/agenda',         icon: '📅' },
  { label: 'Cobranza',       href: '/dashboard/cobranza',       icon: '💰' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-[#141414] border-r border-[#222] flex flex-col">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow">
            <span className="text-sm font-black text-white">P</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">ProyektatAdmin</p>
            <p className="text-xs text-gray-500">Grupo Helios</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if (item.divider) {
            return <div key={i} className="my-3 border-t border-[#222]" />
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 font-semibold'
                  : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#222]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-[#1e1e1e] hover:text-red-400 transition-all"
        >
          <span className="text-base">🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
