import type { CollectionConfig, Where } from 'payload'

import { hasRole, isStaff, ownerOnly, storeIdOf } from '../access/roles'

export const ORDER_STATUSES = [
  { label: 'Waiting for payment', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Printing', value: 'printing' },
  { label: 'Ready for pickup', value: 'ready' },
  { label: 'Out for delivery', value: 'shipped' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value']

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Sales',
    defaultColumns: ['orderNumber', 'contact.name', 'total', 'status', 'paymentStatus', 'fulfilmentMethod', 'createdAt'],
    listSearchableFields: ['orderNumber', 'contact.phone', 'contact.email', 'contact.name'],
    description: 'Every online order. Change the status to send the customer an update.',
  },
  access: {
    // Orders are created only by the checkout endpoint (server side).
    create: () => false,
    read: ({ req }) => {
      const user = req.user as never
      if (hasRole(user, 'owner', 'manager')) return true
      if (hasRole(user, 'staff')) {
        const store = storeIdOf(req)
        return store ? ({ store: { equals: store } } as Where) : false
      }
      if (req.user && !isStaff(user)) return { customer: { equals: req.user.id } }
      return false
    },
    update: ({ req }) => {
      const user = req.user as never
      if (hasRole(user, 'owner', 'manager')) return true
      if (hasRole(user, 'staff')) {
        const store = storeIdOf(req)
        return store ? ({ store: { equals: store } } as Where) : false
      }
      return false
    },
    delete: ownerOnly,
  },
  endpoints: [
    {
      path: '/mark-printed',
      method: 'post',
      handler: async (req) => {
        if (!hasRole(req.user as never, 'owner', 'manager', 'staff')) {
          return Response.json({ error: 'Not allowed' }, { status: 403 })
        }
        const body = (await req.json?.()) as { orderIds?: (number | string)[] } | undefined
        const ids = (body?.orderIds ?? []).slice(0, 500)
        let updated = 0
        for (const id of ids) {
          // Respects store access: staff can only touch their own store's orders.
          const order = await req.payload
            .findByID({ collection: 'orders', id, depth: 0, user: req.user, overrideAccess: false })
            .catch(() => null)
          if (!order || !['paid', 'printing'].includes(order.status)) continue
          await req.payload.update({
            collection: 'orders',
            id,
            user: req.user,
            overrideAccess: false,
            data: {
              items: order.items.map((i) => (i.needsPrinting ? { ...i, printed: true } : i)),
              status: order.fulfilmentMethod === 'pickup' ? 'ready' : 'printing',
            },
          })
          updated++
        }
        return Response.json({ updated })
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update' || !previousDoc || doc.status === previousDoc.status) return doc
        const { notifyStatusChange } = await import('../lib/notify')
        // Don't block the admin save on SMS/email delivery.
        notifyStatusChange(req.payload, doc).catch((err) => req.payload.logger.error(err))
        return doc
      },
    ],
    beforeChange: [
      ({ data, originalDoc, req }) => {
        if (originalDoc && data.status && data.status !== originalDoc.status) {
          data.history = [
            ...(originalDoc.history ?? []),
            { status: data.status, at: new Date().toISOString(), by: (req.user as { name?: string } | null)?.name ?? 'system' },
          ]
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'orderNumber', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
        { name: 'accessToken', type: 'text', index: true, admin: { hidden: true }, access: { read: () => false } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: ORDER_STATUSES as unknown as { label: string; value: string }[],
      admin: { position: 'sidebar' },
    },
    { name: 'customer', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    {
      name: 'contact',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'phone', type: 'text', required: true },
            { name: 'email', type: 'email' },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'product', type: 'relationship', relationTo: 'products' },
            { name: 'title', type: 'text', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'edition', type: 'text' },
            { name: 'size', type: 'text' },
            { name: 'quantity', type: 'number', required: true, min: 1 },
            { name: 'unitPrice', type: 'number', required: true, label: 'Unit price' },
            { name: 'printPrice', type: 'number', label: 'Print & badge price (each)', defaultValue: 0 },
            { name: 'lineTotal', type: 'number', required: true },
          ],
        },
        {
          name: 'print',
          type: 'group',
          label: 'Customisation',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text' },
                { name: 'number', type: 'text' },
                { name: 'font', type: 'text' },
                { name: 'badges', type: 'text', admin: { description: 'Badge names, comma separated' } },
              ],
            },
          ],
        },
        { name: 'needsPrinting', type: 'checkbox', defaultValue: false },
        { name: 'printed', type: 'checkbox', defaultValue: false },
        { name: 'preorder', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      type: 'collapsible',
      label: 'Totals',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'subtotal', type: 'number', required: true },
            { name: 'discountAmount', type: 'number', defaultValue: 0 },
            { name: 'deliveryFee', type: 'number', defaultValue: 0 },
            { name: 'total', type: 'number', required: true },
          ],
        },
        { name: 'discountCode', type: 'relationship', relationTo: 'discount-codes', access: { read: ({ req }) => isStaff(req.user as never) } },
        { name: 'discountLabel', type: 'text' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Pickup or delivery',
      fields: [
        {
          name: 'fulfilmentMethod',
          type: 'select',
          required: true,
          options: [
            { label: 'Pickup in store', value: 'pickup' },
            { label: 'Delivery', value: 'delivery' },
          ],
        },
        {
          name: 'store',
          type: 'relationship',
          relationTo: 'stores',
          index: true,
          admin: { description: 'Pickup store, or the store that packs a delivery.' },
        },
        { name: 'zone', type: 'relationship', relationTo: 'delivery-zones' },
        { name: 'address', type: 'textarea' },
        { name: 'deliveryNotes', type: 'textarea' },
        { name: 'courier', type: 'text', admin: { placeholder: 'Rider name, G4S, Fargo… + tracking no.' } },
        { name: 'pickupCode', type: 'text', admin: { description: 'Customer shows this code to collect.' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Payment',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'paymentMethod',
              type: 'select',
              options: [
                { label: 'M-Pesa', value: 'mpesa' },
                { label: 'Card', value: 'card' },
                { label: 'Pay at pickup', value: 'pickup' },
              ],
            },
            {
              name: 'paymentStatus',
              type: 'select',
              defaultValue: 'unpaid',
              index: true,
              options: [
                { label: 'Unpaid', value: 'unpaid' },
                { label: 'Paid', value: 'paid' },
                { label: 'Failed', value: 'failed' },
                { label: 'Refunded', value: 'refunded' },
              ],
            },
            { name: 'paidAt', type: 'date', index: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'mpesaPhone', type: 'text' },
            { name: 'mpesaCheckoutId', type: 'text', index: true },
            { name: 'mpesaReceipt', type: 'text' },
            { name: 'paystackReference', type: 'text', index: true },
          ],
        },
        { name: 'paymentMessage', type: 'text', admin: { readOnly: true } },
      ],
    },
    {
      name: 'printBatch',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Night this order is printed (set from the cut-off time when paid).',
      },
    },
    {
      name: 'history',
      type: 'array',
      admin: { readOnly: true, initCollapsed: true },
      fields: [
        { name: 'status', type: 'text' },
        { name: 'at', type: 'date' },
        { name: 'by', type: 'text' },
      ],
    },
    { name: 'staffNotes', type: 'textarea', admin: { position: 'sidebar' }, access: { read: ({ req }) => isStaff(req.user as never) } },
  ],
}

