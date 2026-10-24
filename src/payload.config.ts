import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Badges } from './collections/Badges'
import { Banners } from './collections/Banners'
import { Categories } from './collections/Categories'
import { DeliveryZones } from './collections/DeliveryZones'
import { DiscountCodes } from './collections/DiscountCodes'
import { Media } from './collections/Media'
import { Messages } from './collections/Messages'
import { Orders } from './collections/Orders'
import { OtpCodes } from './collections/OtpCodes'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { Stores } from './collections/Stores'
import { Subscribers } from './collections/Subscribers'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const smtpReady = Boolean(process.env.SMTP_HOST)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · EastWest Admin' },
    avatar: 'default',
    components: {
      graphics: {
        Logo: '/components/admin/Brand#AdminLogo',
        Icon: '/components/admin/Brand#AdminIcon',
      },
      beforeDashboard: ['/components/admin/Dashboard#Dashboard'],
      afterNavLinks: ['/components/admin/NavLinks#NavLinks'],
      views: {
        printQueue: {
          Component: '/components/admin/PrintQueue#PrintQueue',
          path: '/print-queue',
        },
      },
    },
  },
  collections: [
    Orders,
    DiscountCodes,
    Products,
    Categories,
    Badges,
    Banners,
    Posts,
    Pages,
    Media,
    Users,
    Subscribers,
    Messages,
    Stores,
    DeliveryZones,
    OtpCodes,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Local development syncs the schema automatically. Deployed sites use the migrations in
    // src/migrations, applied by `npm run build:deploy` before each build.
    push: !process.env.VERCEL && process.env.NODE_ENV !== 'production',
  }),
  email: smtpReady
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'orders@eastwest.ke',
        defaultFromName: 'EastWest Fashions Ke',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  plugins: [
    seoPlugin({
      collections: ['products', 'posts', 'pages', 'categories'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${(doc as { title?: string }).title ?? ''} | EastWest Fashions Ke`,
      generateDescription: ({ doc }) =>
        (doc as { shortDescription?: string; excerpt?: string }).shortDescription ??
        (doc as { excerpt?: string }).excerpt ??
        '',
    }),
    // On Vercel, uploads go to Vercel Blob (the server disk is temporary). Locally they stay in /media.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: { disablePayloadAccessControl: true } },
    }),
  ],
})
