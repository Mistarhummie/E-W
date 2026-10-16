'use client'

import Image from 'next/image'
import React, { useRef, useState } from 'react'

import { cn } from '../../lib/cn'

export function ProductGallery({ images, title, badge }: { images: { src: string; thumb: string; alt: string }[]; title: string; badge?: React.ReactNode }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const touchX = useRef<number | null>(null)
  if (!images.length) return <div className="aspect-[4/5] rounded-3xl bg-mist" />
  const go = (n: number) => setActive((n + images.length) % images.length)

  return (
    <div className="lg:sticky lg:top-24 lg:grid lg:grid-cols-[84px_1fr] lg:gap-4">
      <div className="order-2 mt-3 flex gap-2 overflow-x-auto lg:order-1 lg:mt-0 lg:flex-col">
        {images.map((img, i) => (
          <button
            key={img.src}
            onClick={() => setActive(i)}
            aria-label={`Show image ${i + 1}`}
            aria-current={active === i}
            className={cn('relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-mist transition-all lg:w-full', active === i ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100')}
          >
            <Image src={img.thumb} alt="" fill sizes="84px" className="object-cover" />
          </button>
        ))}
      </div>
      <div
        className="relative order-1 aspect-[4/5] cursor-zoom-in overflow-hidden rounded-3xl bg-mist lg:order-2"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
        }}
        onMouseLeave={() => setZoom(null)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1))
          touchX.current = null
        }}
      >
        {images.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt={i === 0 ? title : img.alt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn('object-cover transition-all duration-500', i === active ? 'opacity-100' : 'opacity-0')}
            style={i === active && zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        ))}
        {badge}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
          {images.map((img, i) => (
            <span key={img.src} className={cn('h-1.5 rounded-full bg-ink transition-all', i === active ? 'w-6' : 'w-1.5 opacity-30')} />
          ))}
        </div>
      </div>
    </div>
  )
}
