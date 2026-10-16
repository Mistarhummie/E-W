import Link from 'next/link'

import { getFooterPages, getSettings, getStores } from '../../lib/queries'
import { Logo } from '../ui/Logo'
import { NewsletterForm } from './NewsletterForm'

export async function Footer() {
  const [settings, pages, stores] = await Promise.all([getSettings(), getFooterPages(), getStores()])
  const socials = [
    ['Instagram', settings.instagram],
    ['TikTok', settings.tiktok],
    ['Facebook', settings.facebook],
    ['X', settings.x],
  ].filter(([, url]) => url) as [string, string][]

  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="border-b border-white/10">
        <div className="container-x grid gap-8 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="display text-4xl leading-none sm:text-5xl">
              Be first to new kits <span className="text-teal">& deals</span>
            </p>
            <p className="mt-3 max-w-md text-white/60">Drops, restocks and match-day offers. No spam, unsubscribe any time.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <span className="text-2xl">
            <Logo inverted />
          </span>
          <p className="mt-5 max-w-sm text-sm text-white/60">
            Football jerseys and gym wear in Nairobi. Order online, add your name and number, and collect in store or get it delivered anywhere in Kenya.
          </p>
          {socials.length ? (
            <div className="mt-6 flex gap-3">
              {socials.map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold transition-colors hover:border-teal hover:text-teal">
                  {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Shop</p>
          <ul className="grid gap-2.5 text-sm text-white/80">
            <li><Link className="hover:text-teal" href="/shop?section=jerseys">Football jerseys</Link></li>
            <li><Link className="hover:text-teal" href="/gym">Gym wear</Link></li>
            <li><Link className="hover:text-teal" href="/shop?section=kids">Kids</Link></li>
            <li><Link className="hover:text-teal" href="/shop?tag=deal">Deals</Link></li>
            <li><Link className="hover:text-teal" href="/blog">Blog</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Help</p>
          <ul className="grid gap-2.5 text-sm text-white/80">
            <li><Link className="hover:text-teal" href="/orders">Track an order</Link></li>
            <li><Link className="hover:text-teal" href="/contact">Contact us</Link></li>
            {pages.map((p) => (
              <li key={p.id}>
                <Link className="hover:text-teal" href={`/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Visit us</p>
          <ul className="grid gap-4 text-sm text-white/80">
            {stores.map((s) => (
              <li key={s.id}>
                <p className="font-semibold text-white">{s.name}</p>
                <p className="text-white/60">{s.address}</p>
              </li>
            ))}
            <li>
              <a className="hover:text-teal" href={`tel:${settings.phone}`}>{settings.phone}</a>
              <br />
              <a className="hover:text-teal" href={`mailto:${settings.email}`}>{settings.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} EastWest Fashions Ke. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {['M-PESA', 'VISA', 'Mastercard'].map((m) => (
              <span key={m} className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-bold tracking-wide text-white/80">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
