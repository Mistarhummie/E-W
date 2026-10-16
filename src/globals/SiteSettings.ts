import type { GlobalConfig } from 'payload'

import { anyone, managers } from '../access/roles'
import { revalidateGlobal } from '../hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Shop settings' },
  access: { read: anyone, update: managers },
  hooks: { afterChange: [revalidateGlobal(['settings', 'catalogue'])] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Announcements',
          fields: [
            {
              name: 'announcements',
              type: 'array',
              label: 'Top bar messages',
              admin: { description: 'Rotating messages in the thin bar above the header.' },
              fields: [
                { name: 'text', type: 'text', required: true },
                { name: 'link', type: 'text' },
              ],
            },
            {
              name: 'deal',
              type: 'group',
              label: 'Deal countdown',
              admin: { description: 'The "Deal of the week" strip on the homepage. Leave product empty to hide it.' },
              fields: [
                { name: 'label', type: 'text', defaultValue: 'Deal of the week' },
                { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true },
                { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
          ],
        },
        {
          label: 'Orders',
          fields: [
            { name: 'freeDeliveryOver', type: 'number', defaultValue: 10000, label: 'Free delivery over (KSH)' },
            {
              type: 'row',
              fields: [
                { name: 'namePrice', type: 'number', defaultValue: 200, label: 'Printed name (KSH)' },
                { name: 'numberPrice', type: 'number', defaultValue: 200, label: 'Printed number (KSH)' },
              ],
            },
            {
              name: 'printCutoff',
              type: 'text',
              defaultValue: '18:00',
              label: 'Print cut-off time (24h, Nairobi)',
              admin: { description: 'Orders paid before this time are printed the same night.' },
            },
            { name: 'allowPayAtPickup', type: 'checkbox', defaultValue: true, label: 'Allow pay at pickup (non-customised items only)' },
            { name: 'returnDays', type: 'number', defaultValue: 7 },
          ],
        },
        {
          label: 'Contact & social',
          fields: [
            { name: 'phone', type: 'text', defaultValue: '+254700011817' },
            { name: 'whatsapp', type: 'text', defaultValue: '254700011817', admin: { description: 'Digits only, with 254.' } },
            { name: 'email', type: 'email', defaultValue: 'eastwefa20@gmail.com' },
            {
              type: 'row',
              fields: [
                { name: 'instagram', type: 'text' },
                { name: 'tiktok', type: 'text' },
                { name: 'facebook', type: 'text' },
                { name: 'x', type: 'text', label: 'X (Twitter)' },
              ],
            },
          ],
        },
        {
          label: 'Tracking',
          fields: [
            { name: 'gaId', type: 'text', label: 'Google Analytics 4 ID', admin: { placeholder: 'G-XXXXXXX' } },
            { name: 'metaPixelId', type: 'text', label: 'Meta (Facebook/Instagram) Pixel ID' },
            { name: 'tiktokPixelId', type: 'text', label: 'TikTok Pixel ID' },
          ],
        },
      ],
    },
  ],
}
