import { CheckCircle2, Clock, Package, Printer, Store, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PaymentWaiter } from '../../../../components/checkout/PaymentWaiter'
import { formatKsh } from '../../../../lib/catalogue'
import { cn } from '../../../../lib/cn'
import { formatPhone } from '../../../../lib/phone'
import { getOrderForPage } from '../../actions/checkout'

export const metadata: Metadata = { title: 'Your order', robots: { index: false } }
export const dynamic = 'force-dynamic'

const STEPS = [
  { key: 'paid', label: 'Paid', icon: CheckCircle2 },
  { key: 'printing', label: 'Printing', icon: Printer },
  { key: 'ready', label: 'Ready', icon: Package },
  { key: 'completed', label: 'Collected / delivered', icon: Store },
] as const

const RANK: Record<string, number> = { pending: -1, paid: 0, printing: 1, ready: 2, shipped: 2, completed: 3 }

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; m?: string }> }) {
  const { number } = await params
  const { t, m } = await searchParams
  const order = await getOrderForPage(number, t)
  if (!order) notFound()

  const paid = order.paymentStatus === 'paid'
  const rank = RANK[order.status] ?? -1
  const store = typeof order.store === 'object' ? order.store : null

  return (
    <div className="container-x max-w-4xl pt-10">
      <p className="text-xs font-bold tracking-[0.25em] text-teal-dark uppercase">Order {order.orderNumber}</p>
      <h1 className="display mt-2 text-5xl leading-none sm:text-6xl">
        {paid ? `Thank you, ${order.contact.name.split(' ')[0]}!` : order.paymentMethod === 'pickup' ? 'Order reserved' : 'Almost there…'}
      </h1>

      {!paid && order.paymentMethod !== 'pickup' && order.status !== 'cancelled' ? (
        <PaymentWaiter
          orderNumber={order.orderNumber}
          token={t ?? ''}
          method={order.paymentMethod ?? 'mpesa'}
          phone={order.mpesaPhone ?? order.contact.phone}
          total={order.total}
          initialMessage={m ?? order.paymentMessage ?? null}
          failed={order.paymentStatus === 'failed'}
          demo={process.env.DEMO_MODE === 'true' && process.env.MPESA_ENV !== 'production'}
        />
      ) : null}

      {paid || order.paymentMethod === 'pickup' ? (
        <>
          <p className="mt-4 max-w-xl text-muted">
            {order.fulfilmentMethod === 'pickup'
              ? `We'll SMS ${formatPhone(order.contact.phone)} when your order is ready at ${store?.name ?? 'the store'}.`
              : `We'll SMS ${formatPhone(order.contact.phone)} when your order is on its way.`}
          </p>
          <ol className="mt-10 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const done = rank >= i
              const Icon = s.icon
              return (
                <li key={s.key} className="relative flex flex-col items-center text-center">
                  {i > 0 ? <span className={cn('absolute top-5 right-1/2 h-0.5 w-full', done ? 'bg-teal' : 'bg-line')} /> : null}
                  <span className={cn('relative flex h-10 w-10 items-center justify-center rounded-full transition-all', done ? 'animate-pop bg-teal text-white' : 'bg-mist text-muted')} style={{ animationDelay: `${i * 120}ms` }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={cn('mt-2 text-xs font-semibold', !done && 'text-muted')}>{s.key === 'ready' && order.fulfilmentMethod === 'delivery' ? 'On the way' : s.label}</span>
                </li>
              )
            })}
          </ol>
          {order.fulfilmentMethod === 'pickup' && order.pickupCode ? (
            <div className="mt-10 flex items-center gap-5 rounded-3xl bg-ink p-6 text-white">
              <span className="display text-5xl tracking-widest text-teal">{order.pickupCode}</span>
              <span className="text-sm text-white/80">Your pickup code. Show it at the counter{store ? ` at ${store.name}` : ''}.</span>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-10 grid gap-6 rounded-3xl border border-line p-6 sm:grid-cols-2">
        <div>
          <p className="label">Items</p>
          <ul className="grid gap-3 text-sm">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {it.quantity} × {it.title}
                  <span className="block text-xs text-muted">{[it.edition, it.size].filter(Boolean).join(' · ')}</span>
                  {it.print?.name || it.print?.number || it.print?.badges ? (
                    <span className="block text-xs text-teal-dark">{[it.print?.name, it.print?.number && `#${it.print.number}`, it.print?.badges].filter(Boolean).join(' · ')}</span>
                  ) : null}
                </span>
                <span className="font-semibold">{formatKsh(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="label">Summary</p>
          <p className="flex justify-between"><span>Subtotal</span><span>{formatKsh(order.subtotal)}</span></p>
          {order.deliveryFee ? <p className="flex justify-between"><span>Delivery</span><span>{formatKsh(order.deliveryFee)}</span></p> : null}
          {order.discountAmount ? <p className="flex justify-between text-teal-dark"><span>{order.discountLabel}</span><span>− {formatKsh(order.discountAmount)}</span></p> : null}
          <p className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{formatKsh(order.total)}</span></p>
          <p className="mt-3 flex items-center gap-2 text-muted">
            {order.fulfilmentMethod === 'pickup' ? <Store className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
            {order.fulfilmentMethod === 'pickup' ? `Pickup: ${store?.name ?? ''}` : `Delivery: ${order.address ?? ''}`}
          </p>
          {order.mpesaReceipt ? <p className="text-muted">M-Pesa receipt: {order.mpesaReceipt}</p> : null}
          {!paid && order.paymentMethod === 'pickup' ? (
            <p className="flex items-center gap-2 text-muted"><Clock className="h-4 w-4" /> Pay at the store when you collect.</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-primary">Continue shopping</Link>
        <Link href="/account" className="btn btn-outline">My account</Link>
      </div>
    </div>
  )
}
