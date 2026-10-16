import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'

import { ContactForm } from '../../../components/layout/ContactForm'
import { Reveal } from '../../../components/ui/Reveal'
import { getSettings, getStores } from '../../../lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contact us & store locations',
  description: 'Visit EastWest Fashions at Sonalux House, Moi Avenue, Nairobi, or reach us on WhatsApp, phone or email.',
}

export default async function ContactPage() {
  const [settings, stores] = await Promise.all([getSettings(), getStores()])

  const storesLd = stores.map((s) => ({
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: `EastWest Fashions, ${s.name}`,
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Nairobi', addressCountry: 'KE' },
    telephone: s.phone || settings.phone || undefined,
    openingHours: (s.hours ?? []).map((h) => `${h.days} ${h.time}`),
  }))

  return (
    <div className="container-x pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storesLd).replace(/</g, '\\u003c') }} />
      <h1 className="display text-5xl sm:text-7xl">Come say hi</h1>
      <p className="mt-3 max-w-xl text-muted">Try your size in store, collect an online order, or message us. We reply fastest on WhatsApp.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {settings.whatsapp ? (
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl bg-[#25D366] p-5 text-white transition-transform duration-300 hover:-translate-y-1"
          >
            <MessageCircle className="h-7 w-7" />
            <span>
              <span className="block font-semibold">WhatsApp</span>
              <span className="text-sm text-white/85">Chat with the team</span>
            </span>
          </a>
        ) : null}
        {settings.phone ? (
          <a href={`tel:${settings.phone}`} className="group flex items-center gap-4 rounded-2xl bg-ink p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-teal">
            <Phone className="h-7 w-7" />
            <span>
              <span className="block font-semibold">Call us</span>
              <span className="text-sm text-white/85">{settings.phone}</span>
            </span>
          </a>
        ) : null}
        {settings.email ? (
          <a href={`mailto:${settings.email}`} className="group flex items-center gap-4 rounded-2xl border border-line p-5 transition-all duration-300 hover:-translate-y-1 hover:border-ink">
            <Mail className="h-7 w-7" />
            <span className="min-w-0">
              <span className="block font-semibold">Email</span>
              <span className="block truncate text-sm text-muted">{settings.email}</span>
            </span>
          </a>
        ) : null}
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="display text-4xl">Our stores</h2>
          <div className="mt-6 grid gap-4">
            {stores.map((s, i) => (
              <Reveal key={s.id} delay={i * 80}>
                <div className="rounded-2xl border border-line p-6 transition-shadow duration-300 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold">{s.name}</h3>
                    {s.pickupEnabled ? <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-semibold text-teal-dark">Click & collect</span> : null}
                  </div>
                  <p className="mt-3 flex gap-2 text-sm whitespace-pre-line">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-dark" />
                    {s.address}
                  </p>
                  {s.hours?.length ? (
                    <div className="mt-3 flex gap-2 text-sm">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-dark" />
                      <ul>
                        {s.hours.map((h) => (
                          <li key={h.id ?? h.days}>
                            <span className="font-semibold">{h.days}</span> {h.time}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {s.mapUrl ? (
                      <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary px-5 py-2.5">
                        Get directions
                      </a>
                    ) : null}
                    {s.phone ? (
                      <a href={`tel:${s.phone}`} className="btn btn-outline px-5 py-2.5">
                        Call store
                      </a>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <section>
          <h2 className="display text-4xl">Send a message</h2>
          <div className="mt-6 rounded-2xl bg-mist p-5 sm:p-8">
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  )
}
