import type { CollectionConfig } from 'payload'

import { anyone, managers } from '../access/roles'
import { slugField } from '../fields/slug'
import { revalidateTags } from '../hooks/revalidate'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'About, FAQ, Delivery, Returns, Size guide, Terms and Privacy.',
  },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  hooks: { afterChange: [revalidateTags(['pages'])] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'intro', type: 'textarea' },
    { name: 'content', type: 'richText' },
    {
      name: 'faqs',
      type: 'array',
      label: 'Questions & answers (shown as an accordion)',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    slugField(),
    {
      name: 'showInFooter',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
