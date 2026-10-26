import type { CollectionConfig } from 'payload'

import { anyone, managers } from '../access/roles'
import { revalidateTags, revalidateTagsOnDelete } from '../hooks/revalidate'

export const Badges: CollectionConfig = {
  slug: 'badges',
  admin: {
    useAsTitle: 'name',
    group: 'Catalogue',
    defaultColumns: ['name', 'group', 'leagues', 'price', 'active'],
    description:
      'Sleeve badges customers can add to a jersey. A badge linked to a league is offered on every customisable jersey in that league; champions badges are added on the winning club’s products.',
  },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  defaultSort: 'sortOrder',
  hooks: { afterChange: [revalidateTags(['catalogue'])], afterDelete: [revalidateTagsOnDelete(['catalogue'])] },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    {
      name: 'group',
      type: 'select',
      required: true,
      defaultValue: 'league',
      options: [
        { label: 'League or champions badge (pick one)', value: 'league' },
        { label: 'Competition badge (pick one)', value: 'competition' },
        { label: 'Campaign badge, e.g. No Room for Racism (pick any)', value: 'extra' },
      ],
    },
    {
      name: 'leagues',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      filterOptions: { section: { equals: 'jerseys' } },
      admin: { description: 'Offer this badge on every customisable jersey in these leagues. Leave empty for club-specific badges.' },
    },
    { name: 'price', type: 'number', required: true, min: 0, label: 'Price (KSH)' },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Square picture of the badge, shown in the customiser.' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
