import type { Metadata } from 'next'

import { CheckoutForm } from '../../../components/checkout/CheckoutForm'
import { getCurrentUser } from '../../../lib/payload'
import { getSettings, getStores, getZones } from '../../../lib/queries'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default async function CheckoutPage() {
  const [settings, stores, zones, user] = await Promise.all([getSettings(), getStores(), getZones(), getCurrentUser()])
  const customer = user && user.role === 'customer' ? user : null
  return (
    <div className="container-x pt-8 pb-10">
      <h1 className="display text-5xl sm:text-6xl">Checkout</h1>
      <CheckoutForm
        stores={stores.filter((s) => s.pickupEnabled).map((s) => ({ id: s.id, name: s.name, address: s.address, hours: (s.hours ?? []).map((h) => `${h.days} ${h.time}`).join(' · ') }))}
        zones={zones.map((z) => ({ id: z.id, name: z.name, description: z.description ?? '', fee: z.fee, eta: z.eta ?? '' }))}
        allowPayAtPickup={Boolean(settings.allowPayAtPickup)}
        freeDeliveryOver={settings.freeDeliveryOver ?? 10000}
        demo={process.env.DEMO_MODE === 'true'}
        customer={
          customer
            ? {
                name: customer.name,
                phone: customer.phone ?? '',
                email: customer.email ?? '',
                address: customer.addresses?.[0]?.address ?? '',
                marketingConsent: Boolean(customer.marketingConsent),
              }
            : null
        }
      />
    </div>
  )
}
