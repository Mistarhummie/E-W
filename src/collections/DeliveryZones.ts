import type { CollectionConfig } from 'payload'

import { anyone, managers } from '../access/roles'

export const DeliveryZones: CollectionConfig = {
  slug: 'delivery-zones',
  admin: {
    useAsTitle: 'name',
    group: 'Shop settings',
    defaultColumns: ['name', 'fee', 'eta', 'active'],
    description: 'Delivery prices by area. Orders above the free-delivery amount in Site settings ship free.',
  },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'name', type: 'text', required: true, admin: { placeholder: 'Nairobi CBD' } },
    { name: 'description', type: 'text', admin: { placeholder: 'Areas covered, e.g. Westlands, Kilimani, Kileleshwa' } },
    { name: 'fee', type: 'number', required: true, min: 0, label: 'Fee (KSH)' },
    { name: 'eta', type: 'text', label: 'Delivery time', admin: { placeholder: 'Next day' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
