import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'D3 Family Tree',
  description: 'Force-directed graph visualization with D3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
