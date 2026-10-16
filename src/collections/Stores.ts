import type { CollectionConfig } from 'payload'

import { anyone, managers, ownerOnly } from '../access/roles'

export const Stores: CollectionConfig = {
  slug: 'stores',
  admin: { useAsTitle: 'name', group: 'Shop settings', description: 'Pickup stores shown at checkout.' },
  access: { read: anyone, create: ownerOnly, update: managers, delete: ownerOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'address', type: 'textarea', required: true },
    { name: 'mapUrl', type: 'text', label: 'Google Maps link' },
    { name: 'phone', type: 'text' },
    {
      name: 'hours',
      type: 'array',
      fields: [
        { name: 'days', type: 'text', required: true, admin: { placeholder: 'Mon–Sat' } },
        { name: 'time', type: 'text', required: true, admin: { placeholder: '8am – 7pm' } },
      ],
    },
    { name: 'pickupEnabled', type: 'checkbox', defaultValue: true },
    {
      name: 'isDispatchStore',
      type: 'checkbox',
      label: 'Delivery orders are packed here',
      defaultValue: false,
    },
  ],
}
