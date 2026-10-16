import type { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { editors, hasRole, isStaff, managers } from '../access/roles'
import { slugField } from '../fields/slug'
import { revalidateTags, revalidateTagsOnDelete } from '../hooks/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog posts' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    description: 'Writers save drafts; a manager or the owner publishes them.',
  },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 30 },
  access: {
    read: ({ req }) => (isStaff(req.user as never) ? true : { _status: { equals: 'published' } }),
    create: editors,
    update: editors,
    delete: managers,
  },
  hooks: {
    beforeChange: [
      ({ data, req, originalDoc }) => {
        if (hasRole(req.user as never, 'writer') && data._status === 'published' && originalDoc?._status !== 'published') {
          data._status = 'draft'
        }
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        if (!data.author && req.user) data.author = req.user.id
        return data
      },
    ],
    afterChange: [revalidateTags(['blog'])],
    afterDelete: [revalidateTagsOnDelete(['blog'])],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'excerpt', type: 'textarea', admin: { description: 'Shown on blog cards and Google results.' } },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'shopProducts',
                labels: { singular: 'Shop this look', plural: 'Shop this look' },
                fields: [
                  { name: 'heading', type: 'text', defaultValue: 'Shop the kits' },
                  { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, required: true },
                ],
              },
            ],
          }),
        ],
      }),
    },
    slugField(),
    {
      name: 'category',
      type: 'select',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Match day', value: 'match-day' },
        { label: 'New kits', value: 'new-kits' },
        { label: 'Style', value: 'style' },
        { label: 'Training', value: 'training' },
        { label: 'Store news', value: 'news' },
      ],
    },
    { name: 'tags', type: 'text', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'author', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
