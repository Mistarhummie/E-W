import type { CollectionConfig } from 'payload'

import { anyone, managers } from '../access/roles'

export const Badges: CollectionConfig = {
  slug: 'badges',
  admin: {
    useAsTitle: 'name',
    group: 'Catalogue',
    defaultColumns: ['name', 'group', 'price', 'active'],
    description: 'Sleeve badges customers can add to a jersey. Choose which badges apply on each product.',
  },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'group',
      type: 'select',
      required: true,
      defaultValue: 'league',
      options: [
        { label: 'League badge (pick one)', value: 'league' },
        { label: 'Competition badge (pick one)', value: 'competition' },
      ],
    },
    { name: 'price', type: 'number', required: true, min: 0, label: 'Price (KSH)' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
