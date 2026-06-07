import './globals.css'

export const metadata = {
  title: 'ProyektatAdmin',
  description: 'Sistema de gestión – Grupo Proyektat & Helios',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
