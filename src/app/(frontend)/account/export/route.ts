import { getCurrentUser, getPayloadClient } from '../../../../lib/payload'

/** "Download my data" for the Data Protection Act. */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return new Response('Please log in', { status: 401 })
  const payload = await getPayloadClient()
  const orders = await payload.find({ collection: 'orders', where: { customer: { equals: user.id } }, limit: 500, depth: 0, overrideAccess: true })
  const { name, email, phone, birthday, favouriteClub, marketingConsent, marketingConsentAt, addresses, savedPrints, createdAt } = user
  const data = {
    exportedAt: new Date().toISOString(),
    profile: { name, email, phone, birthday, favouriteClub, marketingConsent, marketingConsentAt, addresses, savedPrints, createdAt },
    orders: orders.docs.map((o) => ({ orderNumber: o.orderNumber, createdAt: o.createdAt, status: o.status, total: o.total, items: o.items, fulfilment: o.fulfilmentMethod, address: o.address })),
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="eastwest-my-data.json"' },
  })
}
