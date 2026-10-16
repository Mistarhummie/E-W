import type { CollectionConfig } from 'payload'

import { anyone, managers } from '../access/roles'
import { revalidateTags, revalidateTagsOnDelete } from '../hooks/revalidate'

export const Banners: CollectionConfig = {
  slug: 'banners',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'placement', 'startsAt', 'endsAt', 'active'],
    description: 'Homepage and section banners. Images, GIFs or short videos. Set dates to schedule them.',
  },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  defaultSort: 'sortOrder',
  hooks: { afterChange: [revalidateTags(['banners'])], afterDelete: [revalidateTagsOnDelete(['banners'])] },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Big headline on the banner.' } },
    { name: 'subtitle', type: 'text' },
    { name: 'eyebrow', type: 'text', admin: { placeholder: 'NEW SEASON' } },
    {
      name: 'placement',
      type: 'select',
      required: true,
      defaultValue: 'home-hero',
      options: [
        { label: 'Homepage – main slider', value: 'home-hero' },
        { label: 'Homepage – promo tiles', value: 'home-promo' },
        { label: 'Gym wear – main banner', value: 'gym-hero' },
        { label: 'Shop – top of listings', value: 'shop-top' },
      ],
    },
    { name: 'media', type: 'upload', relationTo: 'media', required: true, label: 'Image, GIF or video' },
    { name: 'mobileMedia', type: 'upload', relationTo: 'media', label: 'Phone version (optional, portrait)' },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', label: 'Button text', admin: { placeholder: 'Shop now' } },
        { name: 'ctaLink', type: 'text', label: 'Button link', admin: { placeholder: '/shop?category=premier-league' } },
      ],
    },
    {
      name: 'textTone',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'White text (dark image)', value: 'light' },
        { label: 'Black text (light image)', value: 'dark' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
