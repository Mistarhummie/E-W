import type { CollectionConfig } from 'payload'

import { managers } from '../access/roles'

export const DiscountCodes: CollectionConfig = {
  slug: 'discount-codes',
  labels: { singular: 'Discount code', plural: 'Discount codes & vouchers' },
  admin: {
    useAsTitle: 'code',
    group: 'Sales',
    defaultColumns: ['code', 'type', 'value', 'influencer', 'usedCount', 'revenue', 'active'],
    description:
      'Codes customers type at checkout, automatic sales, influencer codes and gift vouchers. Uses and revenue update when an order is paid.',
  },
  access: { read: managers, create: managers, update: managers, delete: managers },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.code) data.code = String(data.code).toUpperCase().replace(/\s+/g, '')
        if (data?.type === 'voucher' && data.balance == null) data.balance = data.value
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'code', type: 'text', required: true, unique: true, index: true, admin: { placeholder: 'DERBY20' } },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'percent',
          options: [
            { label: '% off', value: 'percent' },
            { label: 'KSH off', value: 'fixed' },
            { label: 'Free delivery', value: 'freeDelivery' },
            { label: 'Free name & number printing', value: 'freePrinting' },
            { label: 'Buy X get Y free', value: 'bxgy' },
            { label: 'Gift voucher (balance)', value: 'voucher' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'value',
          type: 'number',
          min: 0,
          admin: {
            condition: (d) => ['percent', 'fixed', 'voucher'].includes(d?.type),
            description: 'Percent for % off; KSH for KSH off and vouchers.',
          },
        },
        { name: 'buyQty', type: 'number', min: 1, admin: { condition: (d) => d?.type === 'bxgy' } },
        { name: 'getQty', type: 'number', min: 1, admin: { condition: (d) => d?.type === 'bxgy' } },
        {
          name: 'balance',
          type: 'number',
          label: 'Voucher balance left (KSH)',
          admin: { condition: (d) => d?.type === 'voucher' },
        },
      ],
    },
    { name: 'description', type: 'text', admin: { description: 'Shown to the customer, e.g. "20% off all Premier League kits".' } },
    {
      name: 'automatic',
      type: 'checkbox',
      label: 'Apply automatically (no code needed)',
      admin: { description: 'For sales events like Black Friday. The best automatic offer is applied.' },
    },
    {
      type: 'collapsible',
      label: 'Rules',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'minOrder', type: 'number', min: 0, label: 'Minimum order (KSH)' },
            { name: 'maxUses', type: 'number', min: 1, label: 'Max uses in total' },
            { name: 'onePerCustomer', type: 'checkbox', label: 'One use per customer' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
          ],
        },
        {
          name: 'appliesTo',
          type: 'select',
          defaultValue: 'all',
          options: [
            { label: 'Whole order', value: 'all' },
            { label: 'Chosen products', value: 'products' },
            { label: 'Chosen categories', value: 'categories' },
          ],
        },
        {
          name: 'products',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          admin: { condition: (d) => d?.appliesTo === 'products' },
        },
        {
          name: 'categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: { condition: (d) => d?.appliesTo === 'categories' },
        },
      ],
    },
    {
      name: 'influencer',
      type: 'text',
      admin: { position: 'sidebar', description: 'Name of the influencer or partner, for reports.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'usedCount', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'revenue',
      type: 'number',
      defaultValue: 0,
      label: 'Revenue from orders (KSH)',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'discountGiven',
      type: 'number',
      defaultValue: 0,
      label: 'Total discount given (KSH)',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'discountCode',
      admin: { defaultColumns: ['orderNumber', 'total', 'discountAmount', 'createdAt'] },
    },
  ],
}
