'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const AREA_COLORS = {
  'Fotografía':       'bg-pink-500',
  'Video':            'bg-red-500',
  'Eventos':          'bg-amber-500',
  'Transmisiones':    'bg-blue-500',
  'Circuito Cerrado': 'bg-slate-500',
  'Marketing':        'bg-green-500',
  'Audio':            'bg-purple-500',
}

const ESTATUS_COLORS = {
  borrador:  'bg-gray-500/20 text-gray-400',
  enviada:   'bg-blue-500/20 text-blue-400',
  aprobada:  'bg-green-500/20 text-green-400',
  rechazada: 'bg-red-500/20 text-red-400',
  cancelada: 'bg-orange-500/20 text-orange-400',
}

function formatMXN(n) {
  return `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export default function AgendaPage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [vista, setVista] = useState('mes') // 'mes' | 'lista'

  useEffect(() => { fetchEventos() }, [])

  const fetchEventos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cotizaciones')
      .select('*')
      .not('fecha_evento', 'is', null)
      .neq('estatus', 'cancelada')
      .order('fecha_evento', { ascending: true })
    setEventos(data || [])
    setLoading(false)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getEventosForDay = (day) => {
    if (!day) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return eventos.filter(e => e.fecha_evento === dateStr)
  }

  const today = new Date()
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  // Lista: eventos del mes actual o todos futuros
  const eventosMes = eventos.filter(e => {
    const d = new Date(e.fecha_evento + 'T12:00:00')
    return d.getMonth() === month && d.getFullYear() === year
  })

  const eventosFuturos = eventos.filter(e => new Date(e.fecha_evento + 'T12:00:00') >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="text-gray-400 text-sm mt-1">{eventos.length} eventos registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVista('mes')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${vista === 'mes' ? 'bg-brand-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`}>
            📅 Mes
          </button>
          <button onClick={() => setVista('lista')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${vista === 'lista' ? 'bg-brand-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`}>
            📋 Lista
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#222] transition">‹</button>
        <h2 className="text-lg font-bold text-white min-w-[180px] text-center">
          {MESES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#222] transition">›</button>
        <button onClick={goToday} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 text-xs hover:bg-[#222] transition">Hoy</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vista === 'mes' ? (
        <>
          {/* Calendar grid */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#2a2a2a]">
              {DIAS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayEventos = getEventosForDay(day)
                return (
                  <div key={i}
                    className={`min-h-[90px] p-2 border-b border-r border-[#222] last:border-r-0 ${day ? 'cursor-pointer hover:bg-[#1e1e1e]' : ''} transition`}
                    onClick={() => day && dayEventos.length > 0 && setSelected({ day, eventos: dayEventos })}>
                    {day && (
                      <>
                        <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday(day) ? 'bg-brand-600 text-white' : 'text-gray-400'}`}>
                          {day}
                        </span>
                        <div className="space-y-0.5">
                          {dayEventos.slice(0, 2).map(e => (
                            <div key={e.id} className={`text-xs px-1.5 py-0.5 rounded text-white truncate ${AREA_COLORS[e.area] || 'bg-brand-600'}`}>
                              {e.cliente_nombre || e.area}
                            </div>
                          ))}
                          {dayEventos.length > 2 && (
                            <div className="text-xs text-gray-500 px-1">+{dayEventos.length - 2} más</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(AREA_COLORS).map(([area, color]) => (
              <div key={area} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-xs text-gray-500">{area}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Lista view */
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Próximos eventos</p>
          {eventosFuturos.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No hay eventos próximos</div>
          ) : (
            eventosFuturos.map(e => {
              const fecha = new Date(e.fecha_evento + 'T12:00:00')
              const diasRestantes = Math.ceil((fecha - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000 * 60 * 60 * 24))
              return (
                <div key={e.id} onClick={() => setSelected({ day: null, eventos: [e] })}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#3a3a3a] cursor-pointer transition">
                  <div className={`w-1 self-stretch rounded-full ${AREA_COLORS[e.area] || 'bg-brand-600'}`} />
                  <div className="w-14 text-center flex-shrink-0">
                    <p className="text-2xl font-bold text-white">{fecha.getDate()}</p>
                    <p className="text-xs text-gray-500">{MESES[fecha.getMonth()].slice(0, 3)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{e.cliente_nombre || 'Sin cliente'}</p>
                    <p className="text-gray-500 text-xs">{e.area} {e.servicios?.length > 0 ? `· ${e.servicios.slice(0,2).join(', ')}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-semibold">{formatMXN(e.monto_total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diasRestantes === 0 ? 'bg-red-500/20 text-red-400' : diasRestantes <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                      {diasRestantes === 0 ? '¡Hoy!' : diasRestantes === 1 ? 'Mañana' : `${diasRestantes} días`}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Day detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {selected.day ? `${selected.day} de ${MESES[month]}` : 'Detalle del evento'}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              {selected.eventos.map(e => (
                <div key={e.id} className="bg-[#252525] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">{e.cliente_nombre || 'Sin cliente'}</p>
                      <p className="text-gray-400 text-sm">{e.area}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ESTATUS_COLORS[e.estatus]}`}>
                      {e.estatus}
                    </span>
                  </div>
                  {e.servicios?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {e.servicios.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-gray-400 rounded-lg">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#1a1a1a] rounded-lg p-2">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-white text-sm font-bold">{formatMXN(e.monto_total)}</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-2">
                      <p className="text-xs text-gray-500">Anticipo</p>
                      <p className="text-green-400 text-sm font-bold">{formatMXN(e.anticipo)}</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-2">
                      <p className="text-xs text-gray-500">Liquidación</p>
                      <p className="text-amber-400 text-sm font-bold">{formatMXN(e.liquidacion)}</p>
                    </div>
                  </div>
                  {e.descripcion && <p className="text-gray-400 text-xs mt-3">{e.descripcion}</p>}
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)}
              className="w-full mt-4 py-2.5 rounded-xl border border-[#333] text-gray-400 text-sm hover:bg-[#252525] transition">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
