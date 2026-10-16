import type { CollectionConfig } from 'payload'

import { hasRole, isStaff, ownerField, ownerOnly, STAFF_ROLES } from '../access/roles'
import { normalisePhone } from '../lib/phone'
import { otpStrategy } from '../lib/session'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Person', plural: 'Customers & Staff' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'phone', 'role', 'createdAt'],
    group: 'People',
    description: 'Customers who registered on the site, and staff who can use this admin.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    strategies: [otpStrategy],
    // Phone-only customers sign in with an SMS code; their username is their phone number.
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: false },
  },
  access: {
    admin: ({ req }) => isStaff(req.user as never),
    // Anyone can register as a customer; role is forced in the hook below.
    create: () => true,
    read: ({ req }) => {
      if (hasRole(req.user as never, 'owner', 'manager', 'staff')) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    update: ({ req }) => {
      if (hasRole(req.user as never, 'owner')) return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    delete: ownerOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Only the owner may hand out staff roles. Requests from the website or the REST API
        // are forced to "customer"; our own server code (local API) sets roles explicitly.
        if (req.payloadAPI !== 'local' && !hasRole(req.user as never, 'owner')) {
          if (operation === 'create') {
            // The very first account (the admin "create first user" screen) becomes the owner.
            const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
            data.role = totalDocs === 0 ? 'owner' : 'customer'
          } else {
            data.role = originalDoc?.role
          }
        }
        if (data.marketingConsent && !originalDoc?.marketingConsent) {
          data.marketingConsentAt = new Date().toISOString()
        }
        if (typeof data.phone === 'string' && data.phone) {
          data.phone = normalisePhone(data.phone)
          if (!data.username && !originalDoc?.username) data.username = data.phone
        }
        if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase() || null
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'phone',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Kenyan mobile, saved as 2547XXXXXXXX.' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      saveToJWT: true,
      access: { update: ownerField, create: ownerField },
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Owner (everything)', value: 'owner' },
        { label: 'Manager (products, orders, banners, codes, blog)', value: 'manager' },
        { label: 'Store staff (own store orders + print queue)', value: 'staff' },
        { label: 'Writer (blog only)', value: 'writer' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'store',
      type: 'relationship',
      relationTo: 'stores',
      saveToJWT: true,
      access: { update: ownerField, create: ownerField },
      admin: {
        position: 'sidebar',
        condition: (data) => data?.role === 'staff',
        description: 'Store staff only see orders for this store.',
      },
    },
    {
      type: 'collapsible',
      label: 'Profile',
      fields: [
        { name: 'birthday', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'favouriteClub', type: 'text' },
        {
          name: 'marketingConsent',
          type: 'checkbox',
          label: 'Agreed to receive offers by SMS/email',
          defaultValue: false,
        },
        { name: 'marketingConsentAt', type: 'date', admin: { readOnly: true } },
        { name: 'googleId', type: 'text', index: true, admin: { readOnly: true } },
      ],
    },
    {
      name: 'addresses',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'zone', type: 'relationship', relationTo: 'delivery-zones' },
        { name: 'address', type: 'textarea', required: true },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'savedPrints',
      type: 'array',
      label: 'Saved jersey names & numbers',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'number', type: 'text' },
      ],
    },
  ],
}

export const STAFF_ROLE_VALUES = STAFF_ROLES

