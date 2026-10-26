import type { Payload } from 'payload'
import sharp from 'sharp'

/** Renders an SVG to PNG and stores it in the media library. */
export async function png(svg: string, name: string, payload: Payload, alt: string) {
  const data = await sharp(Buffer.from(svg)).png().toBuffer()
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data, mimetype: 'image/png', name: `${name}.png`, size: data.length },
    overrideAccess: true,
  })
  return doc.id
}
