import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { FONTS } from '../../lib/catalogue'
import { PrintActions } from './PrintActions'

const todayNairobi = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' })

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--theme-elevation-200)', fontSize: 13 }
const td: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--theme-elevation-100)', verticalAlign: 'top' }

export async function PrintQueue({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, visibleEntities, permissions } = initPageResult
  const role = (req.user as { role?: string } | null)?.role
  const allowed = role === 'owner' || role === 'manager' || role === 'staff'

  const day = typeof searchParams?.night === 'string' ? searchParams.night : todayNairobi()
  const showPrinted = searchParams?.printed === '1'

  const orders = allowed
    ? await req.payload.find({
        collection: 'orders',
        where: {
          and: [
            { paymentStatus: { equals: 'paid' } },
            { printBatch: { less_than_equal: `${day}T23:59:59.999Z` } },
            { status: { in: showPrinted ? ['paid', 'printing', 'ready', 'shipped'] : ['paid', 'printing'] } },
          ],
        },
        sort: 'paidAt',
        depth: 1,
        limit: 1000,
        user: req.user,
        overrideAccess: false,
      })
    : { docs: [] }

  const rows = orders.docs.flatMap((o) =>
    o.items
      .map((item, index) => ({ order: o, item, index }))
      .filter(({ item }) => item.needsPrinting && (showPrinted || !item.printed)),
  )
  const shirts = rows.reduce((s, r) => s + r.item.quantity, 0)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <div className="gutter--left gutter--right" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <style>{`@media print { .nav, .app-header, .print-hide { display: none !important } .template-default__wrap { padding: 0 !important } }`}</style>
        <h1 style={{ marginBottom: 4 }}>Print queue</h1>
        <p style={{ opacity: 0.75, marginTop: 0 }}>
          Every paid shirt to print up to the night of <strong>{day}</strong>: {rows.length} lines, {shirts} shirts.
          Orders paid after the cut-off time move to the next night.
        </p>
        {!allowed ? (
          <p>You don&apos;t have access to the print queue.</p>
        ) : (
          <>
            <PrintActions day={day} showPrinted={showPrinted} orderIds={[...new Set(rows.map((r) => r.order.id))]} />
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={th}>Order</th>
                  <th style={th}>Shirt</th>
                  <th style={th}>Size</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Name</th>
                  <th style={th}>No.</th>
                  <th style={th}>Font</th>
                  <th style={th}>Badges</th>
                  <th style={th}>Collect / deliver</th>
                  <th style={th}>Done</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ order, item, index }) => (
                  <tr key={`${order.id}-${index}`} style={{ opacity: item.printed ? 0.5 : 1 }}>
                    <td style={td}>
                      <a href={`/admin/collections/orders/${order.id}`}>{order.orderNumber}</a>
                    </td>
                    <td style={td}>
                      {item.title}
                      {item.edition ? <div style={{ fontSize: 12, opacity: 0.7 }}>{item.edition}</div> : null}
                    </td>
                    <td style={td}>{item.size}</td>
                    <td style={td}>{item.quantity}</td>
                    <td style={{ ...td, fontWeight: 700, letterSpacing: 1 }}>{item.print?.name || '—'}</td>
                    <td style={{ ...td, fontWeight: 700, fontSize: 18 }}>{item.print?.number || '—'}</td>
                    <td style={td}>{FONTS.find((f) => f.value === item.print?.font)?.label ?? '—'}</td>
                    <td style={td}>{item.print?.badges || '—'}</td>
                    <td style={td}>
                      {order.fulfilmentMethod === 'pickup'
                        ? `Pickup: ${typeof order.store === 'object' && order.store ? order.store.name : ''}`
                        : 'Delivery'}
                    </td>
                    <td style={td}>{item.printed ? '✓' : '☐'}</td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td style={td} colSpan={10}>
                      Nothing to print. 🎉
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </>
        )}
      </div>
    </DefaultTemplate>
  )
}
