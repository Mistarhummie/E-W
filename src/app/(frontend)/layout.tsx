import type { Metadata, Viewport } from 'next'
import { Inter, Oswald, Poppins } from 'next/font/google'
import React from 'react'

import './globals.css'

import { Analytics } from '../../components/layout/Analytics'
import { AnnouncementBar } from '../../components/layout/AnnouncementBar'
import { Footer } from '../../components/layout/Footer'
import { Header } from '../../components/layout/Header'
import { WhatsAppButton } from '../../components/layout/WhatsAppButton'
import { CartDrawer } from '../../components/shop/CartDrawer'
import { CartProvider } from '../../components/shop/CartProvider'
import { WishlistProvider } from '../../components/shop/WishlistProvider'
import { getSettings } from '../../lib/queries'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-oswald', display: 'swap' })
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-poppins', display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eastwest.ke'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'EastWest Fashions Ke | Football Jerseys & Gym Wear in Nairobi', template: '%s | EastWest Fashions Ke' },
  description:
    'Shop football jerseys and gym wear in Kenya. Add your name, number and badges, pay with M-Pesa, and collect in Nairobi or get it delivered countrywide.',
  openGraph: {
    type: 'website',
    siteName: 'EastWest Fashions Ke',
    locale: 'en_KE',
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'EastWest Fashions' }],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/brand/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
}

export const viewport: Viewport = { themeColor: '#02B3AD', width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  return (
    <html lang="en-KE" className={`${inter.variable} ${oswald.variable} ${poppins.variable}`}>
      <body className="min-h-screen font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <WishlistProvider>
          <CartProvider>
            <AnnouncementBar messages={settings.announcements ?? []} />
            <Header />
            <main id="main">{children}</main>
            <Footer />
            <CartDrawer freeDeliveryOver={settings.freeDeliveryOver ?? 10000} />
            {settings.whatsapp ? <WhatsAppButton number={settings.whatsapp} /> : null}
          </CartProvider>
        </WishlistProvider>
        <Analytics gaId={settings.gaId} metaPixelId={settings.metaPixelId} tiktokPixelId={settings.tiktokPixelId} />
      </body>
    </html>
  )
}
