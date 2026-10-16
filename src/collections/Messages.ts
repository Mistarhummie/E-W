import type { CollectionConfig } from 'payload'

import { anyStaff, managers } from '../access/roles'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Contact message', plural: 'Contact messages' },
  admin: { useAsTitle: 'subject', group: 'People', defaultColumns: ['subject', 'name', 'phone', 'handled', 'createdAt'] },
  access: { read: anyStaff, create: () => false, update: anyStaff, delete: managers },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'subject', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'handled', type: 'checkbox', defaultValue: false },
  ],
}
