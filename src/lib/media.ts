import type { Media } from '../payload-types'

type Size = 'thumb' | 'card' | 'large' | 'hero'

export const asMedia = (m: unknown): Media | null =>
  m && typeof m === 'object' && 'url' in (m as object) ? (m as Media) : null

/** Same-site media becomes a relative path so next/image treats it as local. */
const relative = (url: string | null | undefined) => {
  if (!url) return null
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site && url.startsWith(site)) return url.slice(site.length) || '/'
  return url.replace(/^https?:\/\/localhost(:\d+)?/, '')
}

export function mediaUrl(m: unknown, size?: Size): string | null {
  const media = asMedia(m)
  if (!media) return null
  const sized = size ? media.sizes?.[size]?.url : null
  return relative(sized || media.url)
}

export const isVideo = (m: unknown) => Boolean(asMedia(m)?.mimeType?.startsWith('video/'))
export const isGif = (m: unknown) => asMedia(m)?.mimeType === 'image/gif'

export function mediaRef(m: unknown, size: Size = 'hero') {
  const media = asMedia(m)
  if (!media) return null
  const url = isVideo(media) || isGif(media) ? mediaUrl(media) : mediaUrl(media, size)
  if (!url) return null
  return { url, type: isVideo(media) ? ('video' as const) : ('image' as const), alt: media.alt }
}
