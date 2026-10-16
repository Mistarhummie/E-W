'use client'

import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect } from 'react'

import { formatKsh } from '../../lib/catalogue'
import { cn } from '../../lib/cn'
import { useCart } from './CartProvider'

export function CartDrawer({ freeDeliveryOver }: { freeDeliveryOver: number }) {
  const { lines, open, setOpen, update, remove, subtotal, count } = useCart()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const remaining = Math.max(0, freeDeliveryOver - subtotal)
  const progress = Math.min(100, (subtotal / freeDeliveryOver) * 100)

  return (
    <div className={cn('fixed inset-0 z-50', open ? 'visible' : 'invisible')} aria-hidden={!open}>
      <div className={cn('absolute inset-0 bg-black/40 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-label="Your cart"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-500 ease-out-expo',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="display text-2xl">Your cart ({count})</p>
          <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-mist" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length ? (
          <>
            <div className="border-b border-line px-5 py-3">
              <p className="text-sm">
                {remaining > 0 ? (
                  <>
                    Spend <strong>{formatKsh(remaining)}</strong> more for <strong>free delivery</strong>
                  </>
                ) : (
                  <strong className="text-teal-dark">You&apos;ve unlocked free delivery 🎉</strong>
                )}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-teal transition-all duration-700 ease-out-expo" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex animate-fade-up gap-4 py-5">
                  <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-mist">
                    {l.image ? <Image src={l.image} alt={l.title} fill sizes="96px" className="object-cover" /> : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="font-semibold leading-snug hover:text-teal-dark">
                        {l.title}
                      </Link>
                      <button onClick={() => remove(l.key)} className="text-muted hover:text-sale" aria-label={`Remove ${l.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {[l.edition, `Size ${l.size}`].filter(Boolean).join(' · ')}
                    </p>
                    {l.print && (l.print.name || l.print.number || l.print.badgeNames?.length) ? (
                      <p className="mt-1 text-xs font-medium text-teal-dark">
                        {[l.print.name, l.print.number && `#${l.print.number}`, ...(l.print.badgeNames ?? [])].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button className="p-2 hover:text-teal" onClick={() => update(l.key, l.quantity - 1)} aria-label="Fewer">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                        <button className="p-2 hover:text-teal" onClick={() => update(l.key, l.quantity + 1)} aria-label="More">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-bold">{formatKsh((l.unitPrice + l.printPrice) * l.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line p-5">
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span>{formatKsh(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Delivery and discount codes at checkout.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full py-4 text-base">
                Checkout
              </Link>
              <p className="mt-3 text-center text-xs text-muted">Pay with M-Pesa or card</p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-mist">
              <ShoppingBag className="h-8 w-8 text-muted" />
            </span>
            <p className="display text-2xl">Your cart is empty</p>
            <p className="text-sm text-muted">Find your club&apos;s new kit and make it yours.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-primary">
              Start shopping
            </Link>
          </div>
        )}
      </aside>
    </div>
  )
}
