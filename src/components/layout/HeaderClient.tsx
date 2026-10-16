'use client'

import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { useCart } from '../shop/CartProvider'
import { useWishlist } from '../shop/WishlistProvider'
import { Logo } from '../ui/Logo'

type LinkItem = { label: string; href: string }
export type NavItem = {
  label: string
  href: string
  accent?: boolean
  columns?: { title: string; links: LinkItem[] }[]
  promo?: { title: string; text: string; href: string }
}

export function HeaderClient({ nav }: { nav: NavItem[] }) {
  const { count, setOpen } = useCart()
  const { items: wish } = useWishlist()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mega, setMega] = useState<number | null>(null)
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState(false)
  const lastY = useRef(0)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      setHidden(y > 160 && y > lastY.current)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menus after navigating (adjusting state during render, as React recommends).
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMega(null)
    setMobile(false)
    setSearch(false)
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 border-b bg-white/95 backdrop-blur transition-all duration-300',
          scrolled ? 'border-line shadow-[0_6px_24px_-12px_rgba(0,0,0,0.15)]' : 'border-transparent',
          hidden && !mega && !mobile ? '-translate-y-full' : 'translate-y-0',
        )}
        onMouseLeave={() => setMega(null)}
      >
        <div className="container-x flex h-16 items-center gap-4 lg:h-[72px]">
          <button className="-ml-2 p-2 lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="text-[22px] transition-opacity hover:opacity-80" aria-label="EastWest Fashions home">
            <Logo />
          </Link>

          <nav className="ml-8 hidden h-full items-stretch lg:flex" aria-label="Main">
            {nav.map((item, i) => (
              <div key={item.label} className="flex items-stretch" onMouseEnter={() => setMega(item.columns ? i : null)}>
                <Link
                  href={item.href}
                  className={cn(
                    'link-underline flex items-center px-4 text-[14px] font-semibold tracking-wide uppercase transition-colors',
                    item.accent ? 'text-sale' : 'text-ink hover:text-teal-dark',
                  )}
                  aria-expanded={item.columns ? mega === i : undefined}
                  onFocus={() => setMega(item.columns ? i : null)}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <IconButton label="Search" onClick={() => setSearch(true)}>
              <Search className="h-[22px] w-[22px]" />
            </IconButton>
            <IconLink href="/account" label="Account" className="hidden sm:flex">
              <User className="h-[22px] w-[22px]" />
            </IconLink>
            <IconLink href="/wishlist" label="Wishlist" badge={wish.length} className="hidden sm:flex">
              <Heart className="h-[22px] w-[22px]" />
            </IconLink>
            <IconButton label={`Cart, ${count} items`} onClick={() => setOpen(true)} badge={count}>
              <ShoppingBag className="h-[22px] w-[22px]" />
            </IconButton>
          </div>
        </div>

        {/* Mega menu */}
        {nav.map((item, i) =>
          item.columns ? (
            <div
              key={item.label}
              className={cn(
                'absolute inset-x-0 top-full hidden origin-top border-t border-line bg-white shadow-xl transition-all duration-300 lg:block',
                mega === i ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0',
              )}
            >
              <div className="container-x grid grid-cols-12 gap-8 py-10">
                {item.columns.map((col, ci) => (
                  <div key={col.title} className="col-span-3" style={{ transitionDelay: `${ci * 40}ms` }}>
                    <p className="mb-4 text-xs font-bold tracking-[0.2em] text-muted uppercase">{col.title}</p>
                    <ul className="grid gap-2.5">
                      {col.links.map((l) => (
                        <li key={l.href + l.label}>
                          <Link href={l.href} className="group inline-flex items-center gap-2 text-[15px] font-medium hover:text-teal-dark">
                            <span className="h-[2px] w-0 bg-teal transition-all duration-300 group-hover:w-3" />
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {item.promo ? (
                  <Link
                    href={item.promo.href}
                    className="group col-span-4 col-start-9 flex flex-col justify-end overflow-hidden rounded-2xl bg-ink p-8 text-white"
                  >
                    <span className="display text-4xl leading-none transition-transform duration-500 group-hover:-translate-y-1">
                      {item.promo.title}
                    </span>
                    <span className="mt-3 text-sm text-white/70">{item.promo.text}</span>
                    <span className="mt-6 text-sm font-semibold text-teal">Shop jerseys →</span>
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null,
        )}
      </header>

      <MobileMenu open={mobile} onClose={() => setMobile(false)} nav={nav} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  )
}

function IconButton({
  children,
  label,
  onClick,
  badge,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-mist active:scale-90"
    >
      <span key={badge} className={badge ? 'animate-pop' : undefined}>
        {children}
      </span>
      {badge ? (
        <span key={badge} className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function IconLink({ children, href, label, badge, className }: { children: React.ReactNode; href: string; label: string; badge?: number; className?: string }) {
  return (
    <Link href={href} aria-label={label} className={cn('relative h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-mist active:scale-90', className)}>
      {children}
      {badge ? (
        <span className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

function MobileMenu({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: NavItem[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])
  return (
    <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')} aria-hidden={!open}>
      <div className={cn('absolute inset-0 bg-black/40 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <aside
        className={cn(
          'absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white transition-transform duration-400 ease-out-expo',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <span className="text-xl">
            <Logo />
          </span>
          <button className="p-2" onClick={onClose} aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {nav.map((item, i) => (
            <div key={item.label} className="border-b border-line">
              {item.columns ? (
                <>
                  <button
                    className="flex w-full items-center justify-between py-4 text-lg font-semibold uppercase"
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    aria-expanded={expanded === i}
                  >
                    {item.label}
                    <span className={cn('text-2xl transition-transform', expanded === i && 'rotate-45')}>+</span>
                  </button>
                  <div className={cn('grid transition-all duration-300', expanded === i ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]')}>
                    <div className="overflow-hidden">
                      <Link href={item.href} className="block py-2 font-semibold text-teal-dark">
                        Shop all {item.label.toLowerCase()}
                      </Link>
                      {item.columns.flatMap((c) => c.links).map((l) => (
                        <Link key={l.href + l.label} href={l.href} className="block py-2 text-[15px]">
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link href={item.href} className={cn('block py-4 text-lg font-semibold uppercase', item.accent && 'text-sale')}>
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          <div className="mt-6 grid gap-3 text-[15px]">
            <Link href="/account">My account</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/orders">Track an order</Link>
            <Link href="/contact">Stores & contact</Link>
          </div>
        </nav>
      </aside>
    </div>
  )
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <div className={cn('fixed inset-0 z-50', open ? 'visible' : 'invisible')} aria-hidden={!open}>
      <div className={cn('absolute inset-0 bg-black/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <div className={cn('relative bg-white shadow-2xl transition-transform duration-400 ease-out-expo', open ? 'translate-y-0' : '-translate-y-full')}>
        <form
          className="container-x flex items-center gap-3 py-6"
          onSubmit={(e) => {
            e.preventDefault()
            const q = inputRef.current?.value.trim()
            if (q) router.push(`/shop?q=${encodeURIComponent(q)}`)
          }}
        >
          <Search className="h-6 w-6 text-muted" />
          <input
            ref={inputRef}
            name="q"
            type="search"
            placeholder="Search clubs, kits, gym wear…"
            className="flex-1 bg-transparent py-2 text-2xl font-medium outline-none placeholder:text-muted/60"
          />
          <button type="button" onClick={onClose} className="p-2" aria-label="Close search">
            <X className="h-6 w-6" />
          </button>
        </form>
        <div className="container-x flex flex-wrap gap-2 pb-6">
          {['Arsenal', 'Real Madrid', 'Harambee Stars', 'Barcelona', 'Leggings', 'Retro'].map((t) => (
            <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} className="chip text-xs" onClick={onClose}>
              {t}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
