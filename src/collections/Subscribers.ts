import type { CollectionConfig } from 'payload'

import { managers, ownerOnly } from '../access/roles'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Newsletter subscriber', plural: 'Newsletter' },
  admin: { useAsTitle: 'email', group: 'People', defaultColumns: ['email', 'source', 'createdAt'] },
  access: { read: managers, create: () => false, update: managers, delete: ownerOnly },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'source', type: 'text' },
  ],
}
