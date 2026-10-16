'use client'

import { Check, CreditCard, Loader2, Lock, Smartphone, Store, Tag, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState, useTransition } from 'react'

import { getQuote, placeOrder, type QuoteResponse } from '../../app/(frontend)/actions/checkout'
import { formatKsh } from '../../lib/catalogue'
import { cn } from '../../lib/cn'
import { useCart } from '../shop/CartProvider'

type StoreOpt = { id: number; name: string; address: string; hours: string }
type ZoneOpt = { id: number; name: string; description: string; fee: number; eta: string }

export function CheckoutForm({
  stores,
  zones,
  allowPayAtPickup,
  freeDeliveryOver,
  customer,
  demo,
}: {
  stores: StoreOpt[]
  zones: ZoneOpt[]
  allowPayAtPickup: boolean
  freeDeliveryOver: number
  customer: { name: string; phone: string; email: string; address: string; marketingConsent: boolean } | null
  demo: boolean
}) {
  const router = useRouter()
  const { lines, clear } = useCart()
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [storeId, setStoreId] = useState<number | null>(stores[0]?.id ?? null)
  const [zoneId, setZoneId] = useState<number | null>(null)
  const [contact, setContact] = useState({ name: customer?.name ?? '', phone: customer?.phone ? `0${customer.phone.slice(3)}` : '', email: customer?.email ?? '' })
  const [address, setAddress] = useState(customer?.address ?? '')
  const [notes, setNotes] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [code, setCode] = useState('')
  const [pay, setPay] = useState<'mpesa' | 'card' | 'pickup'>('mpesa')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [consent, setConsent] = useState(customer?.marketingConsent ?? false)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [quoting, startQuote] = useTransition()
  const [placing, setPlacing] = useState(false)

  const cartLines = useMemo(
    () => lines.map((l) => ({ productId: l.productId, edition: l.edition, size: l.size, quantity: l.quantity, print: l.print })),
    [lines],
  )

  useEffect(() => {
    if (!cartLines.length) return
    startQuote(async () => {
      const q = await getQuote({ lines: cartLines, code, fulfilment: { method, storeId, zoneId }, phone: contact.phone })
      setQuote(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLines, code, method, storeId, zoneId])

  // Pay-at-pickup is only for pickup orders without printing; fall back to M-Pesa otherwise.
  if (pay === 'pickup' && (method !== 'pickup' || quote?.hasPrinting)) setPay('mpesa')

  if (!lines.length) {
    return (
      <div className="mt-10 rounded-3xl bg-mist p-12 text-center">
        <p className="display text-3xl">Your cart is empty</p>
        <Link href="/shop" className="btn btn-primary mt-6">Shop now</Link>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlacing(true)
    setErrors([])
    const res = await placeOrder({
      lines: cartLines,
      code,
      fulfilment: { method, storeId, zoneId },
      contact,
      address,
      deliveryNotes: notes,
      payment: { method: pay, mpesaPhone: mpesaPhone || contact.phone },
      marketingConsent: consent,
    })
    if (!res.ok) {
      setErrors(res.errors)
      setPlacing(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    clear()
    if (res.redirect) {
      window.location.href = res.redirect
      return
    }
    const qs = new URLSearchParams({ t: res.token, ...(res.message ? { m: res.message } : {}) })
    router.push(`/orders/${res.orderNumber}?${qs.toString()}`)
  }

  const canPayAtPickup = allowPayAtPickup && method === 'pickup' && !quote?.hasPrinting
  const remaining = Math.max(0, freeDeliveryOver - (quote?.subtotal ?? 0))

  return (
    <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
      <div className="grid gap-10">
        {errors.length ? (
          <div role="alert" className="animate-fade-up rounded-2xl border border-sale/30 bg-sale/5 p-4 text-sm text-sale">
            <ul className="grid gap-1">
              {errors.map((er) => (
                <li key={er}>• {er}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Step n={1} title="Your details">
          {!customer ? (
            <p className="mb-4 text-sm text-muted">
              Have an account? <Link href="/login?next=/checkout" className="font-semibold text-ink underline">Log in</Link> for faster checkout. Or continue as a guest.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Full name</span>
              <input className="field" required autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </label>
            <label>
              <span className="label">Phone (for SMS updates)</span>
              <input className="field" required type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </label>
            <label>
              <span className="label">Email {pay === 'card' ? '' : '(optional)'}</span>
              <input className="field" type="email" autoComplete="email" required={pay === 'card'} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </label>
          </div>
        </Step>

        <Step n={2} title="Pickup or delivery">
          <div className="grid grid-cols-2 gap-3">
            <Choice active={method === 'pickup'} onClick={() => setMethod('pickup')} icon={<Store className="h-5 w-5" />} title="Collect in store" sub="Free · Nairobi CBD" />
            <Choice active={method === 'delivery'} onClick={() => setMethod('delivery')} icon={<Truck className="h-5 w-5" />} title="Delivery" sub={`Free over ${formatKsh(freeDeliveryOver)}`} />
          </div>
          <div className="mt-5 grid gap-3">
            {method === 'pickup'
              ? stores.map((s) => (
                  <Radio key={s.id} name="store" checked={storeId === s.id} onChange={() => setStoreId(s.id)}>
                    <span className="font-semibold">{s.name}</span>
                    <span className="block text-sm text-muted">{s.address}</span>
                    {s.hours ? <span className="block text-xs text-muted">{s.hours}</span> : null}
                  </Radio>
                ))
              : (
                <>
                  {zones.map((z) => (
                    <Radio key={z.id} name="zone" checked={zoneId === z.id} onChange={() => setZoneId(z.id)}>
                      <span className="flex justify-between gap-3">
                        <span className="font-semibold">{z.name}</span>
                        <span className="font-semibold">{remaining <= 0 ? 'Free' : formatKsh(z.fee)}</span>
                      </span>
                      {z.description ? <span className="block text-sm text-muted">{z.description}</span> : null}
                      {z.eta ? <span className="block text-xs text-teal-dark">{z.eta}</span> : null}
                    </Radio>
                  ))}
                  <label className="mt-2">
                    <span className="label">Delivery address</span>
                    <textarea className="field min-h-24" required placeholder="Building, street, area, town" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </label>
                  <label>
                    <span className="label">Notes for the rider (optional)</span>
                    <input className="field" placeholder="Gate code, landmark…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </label>
                </>
              )}
          </div>
        </Step>

        <Step n={3} title="Payment">
          <div className="grid gap-3">
            <Radio name="pay" checked={pay === 'mpesa'} onChange={() => setPay('mpesa')}>
              <span className="flex items-center gap-2 font-semibold"><Smartphone className="h-4 w-4 text-teal" /> M-Pesa</span>
              <span className="block text-sm text-muted">We&apos;ll send a payment prompt to your phone. Enter your PIN to pay.</span>
              {pay === 'mpesa' ? (
                <input
                  className="field mt-3"
                  type="tel"
                  inputMode="tel"
                  placeholder={`M-Pesa number (default ${contact.phone || 'your phone above'})`}
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : null}
            </Radio>
            <Radio name="pay" checked={pay === 'card'} onChange={() => setPay('card')}>
              <span className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4 text-teal" /> Visa or Mastercard</span>
              <span className="block text-sm text-muted">Pay securely on the next page.</span>
            </Radio>
            {canPayAtPickup ? (
              <Radio name="pay" checked={pay === 'pickup'} onChange={() => setPay('pickup')}>
                <span className="font-semibold">Pay when you collect</span>
                <span className="block text-sm text-muted">Only for items without printing.</span>
              </Radio>
            ) : null}
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-teal" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Send me new kits and offers by SMS and email. You can opt out any time.</span>
          </label>
          {demo ? (
            <p className="mt-4 rounded-xl bg-deal/40 p-3 text-xs">
              <strong>Test mode:</strong> no real money is taken. You can mark the order as paid on the next screen.
            </p>
          ) : null}
        </Step>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-mist p-6">
          <p className="display text-2xl">Order summary</p>
          <ul className="mt-4 grid gap-4">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                  {l.image ? <Image src={l.image} alt="" fill sizes="56px" className="object-cover" /> : null}
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold leading-snug">{l.title}</p>
                  <p className="text-xs text-muted">{[l.edition, l.size].filter(Boolean).join(' · ')}</p>
                  {l.print && (l.print.name || l.print.number) ? (
                    <p className="text-xs text-teal-dark">{[l.print.name, l.print.number && `#${l.print.number}`].filter(Boolean).join(' ')}</p>
                  ) : null}
                </div>
                <span className="text-sm font-semibold">{formatKsh((l.unitPrice + l.printPrice) * l.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="field py-2.5 pl-9 uppercase"
                placeholder="Discount or voucher code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setCode(codeInput.trim())
                  }
                }}
              />
            </div>
            <button type="button" className="btn btn-outline px-4 py-2.5" onClick={() => setCode(codeInput.trim())}>
              Apply
            </button>
          </div>
          {code && quote?.codeError ? <p className="mt-2 text-sm text-sale">{quote.codeError}</p> : null}
          {code && quote?.discount?.code ? (
            <p className="mt-2 flex animate-fade-up items-center gap-1 text-sm text-teal-dark">
              <Check className="h-4 w-4" /> {quote.discount.code} applied
            </p>
          ) : null}

          <dl className={cn('mt-5 grid gap-2 border-t border-line pt-5 text-sm transition-opacity', quoting && 'opacity-50')}>
            <Row label="Subtotal" value={formatKsh(quote?.subtotal ?? 0)} />
            <Row label={method === 'pickup' ? 'Pickup' : 'Delivery'} value={method === 'pickup' ? 'Free' : zoneId ? (quote?.deliveryFee ? formatKsh(quote.deliveryFee) : 'Free') : 'Choose area'} />
            {quote?.discount ? <Row label={quote.discount.label} value={`− ${formatKsh(quote.discount.amount)}`} accent /> : null}
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
              <dt className="text-base font-bold">Total</dt>
              <dd className="display text-3xl">{formatKsh(quote?.total ?? 0)}</dd>
            </div>
          </dl>
          {quote?.errors.length ? (
            <ul className="mt-3 grid gap-1 text-xs text-sale">
              {quote.errors.map((er) => (
                <li key={er}>{er}</li>
              ))}
            </ul>
          ) : null}

          <button type="submit" disabled={placing || quoting} className="btn btn-primary mt-6 w-full py-4 text-base">
            {placing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Placing order…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                {pay === 'mpesa' ? 'Pay with M-Pesa' : pay === 'card' ? 'Pay by card' : 'Reserve order'} · {formatKsh(quote?.total ?? 0)}
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            By ordering you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        </div>
      </aside>
    </form>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="animate-fade-up" style={{ animationDelay: `${n * 60}ms` }}>
      <h2 className="mb-5 flex items-center gap-3 text-xl font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Choice({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn('flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-300', active ? 'border-ink bg-white shadow-md' : 'border-line hover:border-ink/40')}>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors', active ? 'bg-teal text-white' : 'bg-mist')}>{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
    </button>
  )
}

function Radio({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={cn('flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all', checked ? 'border-ink bg-white shadow-sm' : 'border-line hover:border-ink/40')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-teal" />
      <span className="flex-1">{children}</span>
    </label>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn('flex justify-between', accent && 'text-teal-dark')}>
      <dt>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
