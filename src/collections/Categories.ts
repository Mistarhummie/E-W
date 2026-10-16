import type { CollectionConfig } from 'payload'

import { anyone, managers } from '../access/roles'
import { slugField } from '../fields/slug'
import { revalidateTags } from '../hooks/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'section', 'parent', 'showOnHome'],
    description: 'Leagues, clubs and gym wear types. Used for menus, filters and the "Shop by league" tiles.',
  },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  defaultSort: 'sortOrder',
  hooks: { afterChange: [revalidateTags(['catalogue'])] },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      name: 'section',
      type: 'select',
      required: true,
      defaultValue: 'jerseys',
      options: [
        { label: 'Football jerseys', value: 'jerseys' },
        { label: 'Gym wear', value: 'gym' },
        { label: 'Kids', value: 'kids' },
        { label: 'Accessories', value: 'accessories' },
      ],
    },
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'textarea' },
    { name: 'showOnHome', type: 'checkbox', label: 'Show as a tile on the homepage', defaultValue: false },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
