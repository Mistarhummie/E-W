import Link from 'next/link'
import type { ServerProps } from 'payload'
import React from 'react'

import { formatKsh } from '../../lib/catalogue'

const card: React.CSSProperties = {
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-100)',
  borderRadius: 12,
  padding: '18px 20px',
}

const nairobiMidnight = () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }))
  now.setHours(0, 0, 0, 0)
  // Nairobi is UTC+3 all year.
  return new Date(now.getTime() - 3 * 60 * 60 * 1000)
}

export async function Dashboard({ payload, user }: ServerProps) {
  const role = (user as { role?: string } | undefined)?.role
  if (!role || role === 'writer' || role === 'customer') return null

  const since = nairobiMidnight().toISOString()
  const [paidToday, toProcess, toPrint, lowStock] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { and: [{ paymentStatus: { equals: 'paid' } }, { paidAt: { greater_than_equal: since } }] },
      limit: 500,
      depth: 0,
      user,
      overrideAccess: false,
      select: { total: true },
    }),
    payload.count({ collection: 'orders', where: { status: { in: ['paid', 'printing'] } }, user, overrideAccess: false }),
    payload.count({
      collection: 'orders',
      where: { and: [{ status: { equals: 'paid' } }, { printBatch: { exists: true } }] },
      user,
      overrideAccess: false,
    }),
    payload.count({
      collection: 'products',
      where: { and: [{ trackStock: { equals: true } }, { totalStock: { less_than_equal: 3 } }, { status: { equals: 'active' } }] },
    }),
  ])
  const revenue = paidToday.docs.reduce((s, o) => s + (o.total ?? 0), 0)

  const stats = [
    { label: 'Paid orders today', value: String(paidToday.totalDocs), href: '/admin/collections/orders?where[paymentStatus][equals]=paid' },
    ...(role === 'owner' || role === 'manager' ? [{ label: 'Sales today', value: formatKsh(revenue), href: '/admin/collections/orders' }] : []),
    { label: 'Orders to process', value: String(toProcess.totalDocs), href: '/admin/collections/orders?where[status][in]=paid,printing' },
    { label: 'Orders waiting to print', value: String(toPrint.totalDocs), href: '/admin/print-queue' },
    ...(role !== 'staff' ? [{ label: 'Products low on stock (≤3)', value: String(lowStock.totalDocs), href: '/admin/collections/products?where[totalStock][less_than_equal]=3' }] : []),
  ]

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 14px' }}>Today at EastWest</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ ...card, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{s.value}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
