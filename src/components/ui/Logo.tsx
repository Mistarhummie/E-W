import Image from 'next/image'

import { cn } from '../../lib/cn'

/**
 * The approved EastWest logo, cut into layouts from the original artwork (public/brand).
 * The artwork has black lettering, so on dark backgrounds it sits on a white panel.
 */
const VARIANTS = {
  horizontal: { src: '/brand/logo-horizontal.png', width: 2000, height: 399 },
  compact: { src: '/brand/logo-horizontal-compact.png', width: 2000, height: 368 },
  stacked: { src: '/brand/logo-stacked.png', width: 2000, height: 1327 },
  wordmark: { src: '/brand/logo-wordmark.png', width: 2000, height: 505 },
  icon: { src: '/brand/logo-icon.png', width: 1066, height: 1066 },
} as const

export function Logo({
  variant = 'horizontal',
  className,
  priority = false,
}: {
  variant?: keyof typeof VARIANTS
  /** Set the height with a class, e.g. h-9; the width follows. */
  className?: string
  priority?: boolean
}) {
  const v = VARIANTS[variant]
  return (
    <Image
      src={v.src}
      width={v.width}
      height={v.height}
      alt="EastWest Fashions Ke"
      priority={priority}
      sizes="(max-width: 640px) 200px, 320px"
      className={cn('h-9 w-auto select-none', className)}
    />
  )
}
