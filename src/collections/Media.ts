import type { CollectionConfig } from 'payload'

import { anyone, anyStaff, managers } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image / Video', plural: 'Images & Videos' },
  admin: { group: 'Content', description: 'Photos, GIFs and videos. Images are resized and compressed automatically.' },
  access: { read: anyone, create: anyStaff, update: anyStaff, delete: managers },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: { description: 'Short description for Google and screen readers, e.g. "Arsenal home shirt 24/25 front".' },
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'],
    focalPoint: true,
    formatOptions: { format: 'webp', options: { quality: 82 } },
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    imageSizes: [
      { name: 'thumb', width: 320, height: 320, fit: 'inside', formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'card', width: 720, height: 720, fit: 'inside', formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1400, height: 1400, fit: 'inside', formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'hero', width: 2000, fit: 'inside', formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
    adminThumbnail: 'thumb',
  },
}
