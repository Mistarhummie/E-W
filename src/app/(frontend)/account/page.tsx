import { Download, LogOut, Package } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { DeleteAccountButton, ProfileForm } from '../../../components/account/ProfileForm'
import { formatKsh } from '../../../lib/catalogue'
import { cn } from '../../../lib/cn'
import { getCurrentUser, getPayloadClient } from '../../../lib/payload'
import { formatPhone } from '../../../lib/phone'
import { logout } from '../actions/auth'

export const metadata: Metadata = { title: 'My account', robots: { index: false } }
export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Awaiting payment', tone: 'bg-deal/30 text-ink' },
  paid: { label: 'Paid', tone: 'bg-teal-light text-teal-dark' },
  printing: { label: 'Printing', tone: 'bg-teal-light text-teal-dark' },
  ready: { label: 'Ready', tone: 'bg-teal text-white' },
  shipped: { label: 'On the way', tone: 'bg-teal text-white' },
  completed: { label: 'Completed', tone: 'bg-ink text-white' },
  cancelled: { label: 'Cancelled', tone: 'bg-mist text-muted' },
  refunded: { label: 'Refunded', tone: 'bg-mist text-muted' },
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/account')
  if (user.role !== 'customer') redirect('/admin')

  const payload = await getPayloadClient()
  const orders = await payload.find({
    collection: 'orders',
    where: { customer: { equals: user.id } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
    select: { orderNumber: true, status: true, total: true, createdAt: true, items: true, fulfilmentMethod: true },
  })

  const firstName = user.name?.split(' ')[0] || 'there'

  return (
    <div className="container-x pt-12 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-teal-dark uppercase">My account</p>
          <h1 className="display mt-1 text-5xl sm:text-6xl">Hi {firstName}</h1>
          <p className="mt-2 text-muted">{[user.phone ? formatPhone(user.phone) : null, user.email].filter(Boolean).join(' · ')}</p>
        </div>
        <form action={logout}>
          <button className="btn btn-outline px-5 py-2.5">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </form>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="display text-3xl">Orders</h2>
          {orders.docs.length ? (
            <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {orders.docs.map((o) => {
                const s = STATUS[o.status ?? 'pending'] ?? STATUS.pending
                const count = (o.items ?? []).reduce((n, i) => n + (i.quantity ?? 1), 0)
                return (
                  <li key={o.id}>
                    <Link href={`/orders/${o.orderNumber}`} className="group flex items-center gap-4 p-4 transition-colors hover:bg-mist sm:p-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist group-hover:bg-white">
                        <Package className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{o.orderNumber}</span>
                        <span className="block text-sm text-muted">
                          {new Date(o.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} · {count} item{count === 1 ? '' : 's'} ·{' '}
                          {o.fulfilmentMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold">{formatKsh(o.total ?? 0)}</span>
                        <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', s.tone)}>{s.label}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl bg-mist p-8 text-center">
              <p className="font-semibold">No orders yet</p>
              <p className="mt-1 text-sm text-muted">Your orders will show here, with live status updates.</p>
              <Link href="/shop" className="btn btn-primary mt-5">
                Start shopping
              </Link>
            </div>
          )}
          <p className="mt-4 text-sm text-muted">
            Ordered as a guest? <Link href="/orders" className="font-semibold text-ink underline">Track it with your order number</Link>.
          </p>
        </section>

        <section>
          <h2 className="display text-3xl">Profile</h2>
          <div className="mt-6 rounded-2xl border border-line p-5 sm:p-6">
            <ProfileForm
              profile={{
                name: user.name,
                email: user.email,
                birthday: user.birthday,
                favouriteClub: user.favouriteClub,
                marketingConsent: user.marketingConsent,
                address: user.addresses?.[0]?.address,
              }}
            />
          </div>
          <div className="mt-6 space-y-4 rounded-2xl bg-mist p-5 sm:p-6">
            <h3 className="font-semibold">Your data</h3>
            <p className="text-sm text-muted">Under Kenya&apos;s Data Protection Act you can download or delete the data we hold about you.</p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from a route handler */}
            <a href="/account/export" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
              <Download className="h-4 w-4" /> Download my data
            </a>
            <div>
              <DeleteAccountButton />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
