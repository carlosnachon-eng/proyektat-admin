import jsPDF from 'jspdf'

const BRAND = {
  primary:   [98,  69, 240],   // purple
  dark:      [15,  15,  15],
  gray:      [100, 100, 100],
  lightGray: [240, 240, 240],
  white:     [255, 255, 255],
}

const CONTACTO = {
  nombre:    'Grupo Proyektat & Helios',
  tel:       '222 410 9544',
  email:     'israelesmo@hotmail.com',
  direccion: 'Privada Tecaxco, Av. Antiguo Rancho a Morillotla #14',
  ciudad:    'C.P. 72570, Heroica Puebla de Zaragoza, Pue.',
  web:       'israelmoret.com',
  facebook:  'israelmoretfotografia',
  instagram: '@moret_fotografia',
}

function formatMXN(n) {
  return `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatFecha(str) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function generarCotizacionPDF(cotizacion) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 16

  // ── HEADER BAND ──────────────────────────────────────────────
  doc.setFillColor(...BRAND.primary)
  doc.rect(0, 0, W, 38, 'F')

  // Logo placeholder (circle with P)
  doc.setFillColor(255, 255, 255, 0.15)
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.5)
  doc.circle(margin + 10, 19, 10, 'S')
  doc.setTextColor(...BRAND.white)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('P', margin + 10, 23, { align: 'center' })

  // Company name
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(CONTACTO.nombre, margin + 25, 16)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${CONTACTO.web}  ·  ${CONTACTO.tel}  ·  ${CONTACTO.email}`, margin + 25, 23)
  doc.text(CONTACTO.direccion + ' — ' + CONTACTO.ciudad, margin + 25, 29)

  // COTIZACIÓN label top right
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('COTIZACIÓN', W - margin, 16, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(cotizacion.folio, W - margin, 23, { align: 'right' })
  doc.text(`Fecha: ${formatFecha(new Date().toISOString().split('T')[0])}`, W - margin, 29, { align: 'right' })

  let y = 50

  // ── CLIENTE + EVENTO ─────────────────────────────────────────
  // Left: cliente
  doc.setFillColor(...BRAND.lightGray)
  doc.roundedRect(margin, y, 85, 32, 2, 2, 'F')
  doc.setTextColor(...BRAND.gray)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', margin + 4, y + 7)
  doc.setTextColor(...BRAND.dark)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(cotizacion.cliente_nombre || 'Sin especificar', margin + 4, y + 15)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.gray)
  doc.text('Estimado cliente, presentamos la siguiente cotización.', margin + 4, y + 22, { maxWidth: 77 })

  // Right: evento info
  doc.setFillColor(...BRAND.lightGray)
  doc.roundedRect(margin + 90, y, 85, 32, 2, 2, 'F')
  doc.setTextColor(...BRAND.gray)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLES DEL EVENTO', margin + 94, y + 7)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.dark)
  doc.text(`Área:`, margin + 94, y + 15)
  doc.setFont('helvetica', 'bold')
  doc.text(cotizacion.area || '—', margin + 112, y + 15)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha:`, margin + 94, y + 22)
  doc.setFont('helvetica', 'bold')
  doc.text(formatFecha(cotizacion.fecha_evento), margin + 112, y + 22)
  doc.setFont('helvetica', 'normal')
  doc.text(`Estatus:`, margin + 94, y + 29)
  doc.setFont('helvetica', 'bold')
  doc.text((cotizacion.estatus || '').toUpperCase(), margin + 112, y + 29)

  y += 42

  // ── SERVICIOS ────────────────────────────────────────────────
  if (cotizacion.servicios?.length > 0) {
    doc.setFillColor(...BRAND.primary)
    doc.roundedRect(margin, y, W - margin * 2, 8, 1, 1, 'F')
    doc.setTextColor(...BRAND.white)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('SERVICIOS INCLUIDOS', margin + 3, y + 5.5)
    y += 12

    const cols = 3
    const colW = (W - margin * 2) / cols
    cotizacion.servicios.forEach((s, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = margin + col * colW
      const sy = y + row * 7
      doc.setFillColor(...BRAND.primary)
      doc.circle(x + 2.5, sy + 1.5, 1.2, 'F')
      doc.setTextColor(...BRAND.dark)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(s, x + 5.5, sy + 2.5)
    })
    y += Math.ceil(cotizacion.servicios.length / cols) * 7 + 6
  }

  // ── DESCRIPCION ──────────────────────────────────────────────
  if (cotizacion.descripcion) {
    doc.setFillColor(...BRAND.primary)
    doc.roundedRect(margin, y, W - margin * 2, 8, 1, 1, 'F')
    doc.setTextColor(...BRAND.white)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIPCIÓN DEL SERVICIO', margin + 3, y + 5.5)
    y += 11

    doc.setTextColor(...BRAND.dark)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(cotizacion.descripcion, W - margin * 2 - 4)
    doc.text(lines, margin + 2, y)
    y += lines.length * 5 + 6
  }

  // ── TABLA DE MONTOS ──────────────────────────────────────────
  doc.setFillColor(...BRAND.primary)
  doc.roundedRect(margin, y, W - margin * 2, 8, 1, 1, 'F')
  doc.setTextColor(...BRAND.white)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN FINANCIERO', margin + 3, y + 5.5)
  y += 11

  const rows = [
    ['Total del servicio', formatMXN(cotizacion.monto_total), false],
    ['Anticipo requerido (50%)', formatMXN(cotizacion.anticipo), false],
    ['Liquidación (al finalizar)', formatMXN(cotizacion.liquidacion), true],
  ]

  rows.forEach(([label, value, highlight], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248)
      doc.rect(margin, y - 1, W - margin * 2, 9, 'F')
    }
    if (highlight) {
      doc.setFillColor(...BRAND.primary)
      doc.rect(margin, y - 1, W - margin * 2, 9, 'F')
      doc.setTextColor(...BRAND.white)
    } else {
      doc.setTextColor(...BRAND.dark)
    }
    doc.setFontSize(9)
    doc.setFont('helvetica', highlight ? 'bold' : 'normal')
    doc.text(label, margin + 4, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.text(value, W - margin - 4, y + 5, { align: 'right' })
    y += 9
  })

  y += 8

  // ── NOTAS ────────────────────────────────────────────────────
  if (cotizacion.notas) {
    doc.setDrawColor(...BRAND.primary)
    doc.setLineWidth(0.5)
    doc.line(margin, y, margin + 4, y)
    doc.setTextColor(...BRAND.gray)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTAS', margin + 6, y + 0.5)
    doc.line(margin + 17, y, W - margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.dark)
    const notaLines = doc.splitTextToSize(cotizacion.notas, W - margin * 2)
    doc.text(notaLines, margin, y)
    y += notaLines.length * 5 + 6
  }

  // ── CONDICIONES ──────────────────────────────────────────────
  y += 4
  doc.setFillColor(250, 248, 255)
  doc.roundedRect(margin, y, W - margin * 2, 22, 2, 2, 'F')
  doc.setDrawColor(...BRAND.primary)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, W - margin * 2, 22, 2, 2, 'S')
  doc.setTextColor(...BRAND.gray)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('CONDICIONES GENERALES', margin + 4, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const condiciones = [
    '• Esta cotización tiene una vigencia de 15 días naturales a partir de la fecha de emisión.',
    '• Para confirmar el servicio se requiere el pago del anticipo indicado.',
    '• El saldo restante deberá liquidarse al finalizar el servicio.',
    '• Los precios incluyen IVA. Cualquier servicio adicional será cotizado por separado.',
  ]
  condiciones.forEach((c, i) => {
    doc.text(c, margin + 4, y + 11 + i * 3.5)
  })

  // ── FOOTER ───────────────────────────────────────────────────
  const footerY = 282
  doc.setFillColor(...BRAND.primary)
  doc.rect(0, footerY, W, 15, 'F')
  doc.setTextColor(...BRAND.white)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`📞 ${CONTACTO.tel}   ✉ ${CONTACTO.email}   🌐 ${CONTACTO.web}`, W / 2, footerY + 5.5, { align: 'center' })
  doc.text(`fb: ${CONTACTO.facebook}   ig: ${CONTACTO.instagram}`, W / 2, footerY + 10.5, { align: 'center' })

  doc.save(`Cotizacion-${cotizacion.folio}.pdf`)
}
