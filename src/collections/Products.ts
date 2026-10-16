import type { CollectionConfig } from 'payload'

import { managers, publishedOrStaff } from '../access/roles'
import { slugField } from '../fields/slug'
import { SIZE_GROUPS, TRAINING_TYPES } from '../lib/catalogue'
import { revalidateTags, revalidateTagsOnDelete } from '../hooks/revalidate'

const allSizes = Array.from(new Set(Object.values(SIZE_GROUPS).flat()))

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'section', 'category', 'price', 'status', 'updatedAt'],
    listSearchableFields: ['title', 'club', 'season'],
    description: 'Jerseys, gym wear and accessories. Products without a photo stay hidden from the shop.',
  },
  access: {
    read: publishedOrStaff('status', 'active'),
    create: managers,
    update: managers,
    delete: managers,
  },
  hooks: {
    afterChange: [revalidateTags(['catalogue'])],
    afterDelete: [revalidateTagsOnDelete(['catalogue'])],
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        // Keep a quick total for listings and "sold out" badges.
        if (data.trackStock && Array.isArray(data.inventory)) {
          data.totalStock = data.inventory.reduce(
            (sum: number, row: { stock?: number }) => sum + Math.max(0, Number(row?.stock) || 0),
            0,
          )
        }
        data.hasImage = Array.isArray(data.images) && data.images.length > 0
        // Lowest price customers can pay, for sorting and "from KSH" labels.
        const editionPrices = Array.isArray(data.editions)
          ? data.editions.map((e: { price?: number }) => Number(e?.price)).filter((n: number) => n > 0)
          : []
        data.fromPrice = editionPrices.length ? Math.min(...editionPrices) : data.price
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          fields: [
            { name: 'title', type: 'text', required: true },
            {
              type: 'row',
              fields: [
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
                { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'club', type: 'text', admin: { placeholder: 'Arsenal' } },
                { name: 'season', type: 'text', admin: { placeholder: '24/25' } },
                {
                  name: 'gender',
                  type: 'select',
                  defaultValue: 'unisex',
                  options: ['men', 'women', 'unisex', 'kids'].map((v) => ({ label: v[0].toUpperCase() + v.slice(1), value: v })),
                },
              ],
            },
            {
              name: 'training',
              type: 'select',
              hasMany: true,
              label: 'How do you train? (gym wear)',
              options: TRAINING_TYPES.map((t) => ({ label: t.label, value: t.value })),
              admin: { condition: (data) => data?.section === 'gym' },
            },
            { name: 'shortDescription', type: 'textarea', admin: { description: 'One or two lines shown near the price.' } },
            { name: 'description', type: 'richText' },
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'First image is the main photo. Add back views for jerseys.' },
            },
            {
              name: 'backImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Plain back of the shirt, used for the live name & number preview (optional).' },
            },
          ],
        },
        {
          label: 'Price & stock',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'price', type: 'number', required: true, min: 0, label: 'Price (KSH)' },
                {
                  name: 'compareAtPrice',
                  type: 'number',
                  min: 0,
                  label: 'Was price (KSH)',
                  admin: { description: 'Shows crossed out with a % off badge.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'saleStartsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'saleEndsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
            {
              name: 'editions',
              type: 'array',
              label: 'Editions',
              admin: {
                description: 'e.g. Fan Edition and Player Edition, each with its own price. Leave empty if there is only one version.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true, admin: { placeholder: 'Player Edition' } },
                    { name: 'price', type: 'number', required: true, min: 0, label: 'Price (KSH)' },
                    { name: 'compareAtPrice', type: 'number', min: 0, label: 'Was price (KSH)' },
                  ],
                },
              ],
            },
            {
              name: 'sizeGroup',
              type: 'select',
              required: true,
              defaultValue: 'adult',
              options: [
                { label: 'Adult S–3XL', value: 'adult' },
                { label: "Women's XS–XL", value: 'women' },
                { label: 'Kids by age', value: 'kids' },
                { label: 'One size', value: 'onesize' },
              ],
            },
            { name: 'trackStock', type: 'checkbox', defaultValue: true, label: 'Track stock per size' },
            {
              name: 'inventory',
              type: 'array',
              label: 'Stock',
              admin: {
                condition: (data) => Boolean(data?.trackStock),
                description: 'One row per size (and edition, if any). Sizes with 0 show as sold out.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'edition', type: 'text', admin: { placeholder: 'Leave empty if no editions' } },
                    { name: 'size', type: 'select', required: true, options: allSizes },
                    { name: 'stock', type: 'number', required: true, min: 0, defaultValue: 0 },
                  ],
                },
              ],
            },
            { name: 'totalStock', type: 'number', admin: { readOnly: true, position: 'sidebar' } },
            {
              type: 'row',
              fields: [
                { name: 'preorder', type: 'checkbox', label: 'Allow pre-orders when sold out' },
                {
                  name: 'shipsBy',
                  type: 'date',
                  admin: { condition: (data) => Boolean(data?.preorder), date: { pickerAppearance: 'dayOnly' } },
                },
              ],
            },
          ],
        },
        {
          label: 'Customisation',
          fields: [
            {
              name: 'customisable',
              type: 'checkbox',
              label: 'Customers can add name, number and badges',
              defaultValue: false,
            },
            {
              name: 'badges',
              type: 'relationship',
              relationTo: 'badges',
              hasMany: true,
              admin: {
                condition: (data) => Boolean(data?.customisable),
                description: 'Badges offered on this shirt. Leave empty for name and number only.',
              },
            },
            {
              name: 'nameColour',
              type: 'text',
              defaultValue: '#ffffff',
              label: 'Print colour for preview',
              admin: { condition: (data) => Boolean(data?.customisable), description: 'Hex colour, e.g. #ffffff' },
            },
          ],
        },
        {
          label: 'Merchandising',
          fields: [
            {
              name: 'tags',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'New in', value: 'new' },
                { label: 'Trending', value: 'trending' },
                { label: 'Top seller', value: 'top' },
                { label: 'Deal', value: 'deal' },
              ],
            },
            { name: 'related', type: 'relationship', relationTo: 'products', hasMany: true },
            { name: 'legacyUrl', type: 'text', admin: { description: 'Old eastwest.ke address, redirected here.' } },
          ],
        },
      ],
    },
    slugField(),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Live on site', value: 'active' },
        { label: 'Hidden', value: 'hidden' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar' } },
    { name: 'hasImage', type: 'checkbox', admin: { hidden: true } },
    { name: 'fromPrice', type: 'number', index: true, admin: { hidden: true } },
    { name: 'soldCount', type: 'number', defaultValue: 0, admin: { readOnly: true, position: 'sidebar' } },
  ],
}
