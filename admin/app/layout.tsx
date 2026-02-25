import type { Metadata } from 'next'
import { Poppins, Cinzel } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
})

export const metadata: Metadata = {
  title: 'SweatBox Gym - Admin Dashboard',
  description: 'Manage your gym operations, clients, and trainers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} ${cinzel.variable} font-sans antialiased bg-surface-dark min-h-screen text-slate-200`}>
        {children}
      </body>
    </html>
  )
}
