'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'

export type HeroSlide = {
  id: number | string
  title: string
  subtitle?: string | null
  eyebrow?: string | null
  ctaLabel?: string | null
  ctaLink?: string | null
  textTone?: string | null
  media: { url: string; type: 'image' | 'video'; alt?: string | null } | null
  mobileMedia?: { url: string; type: 'image' | 'video' } | null
}

const INTERVAL = 6000

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)
  const count = slides.length
  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count])

  useEffect(() => {
    if (count < 2 || paused) return
    const t = setTimeout(() => go(index + 1), INTERVAL)
    return () => clearTimeout(t)
  }, [index, paused, count, go])

  if (!count) return null

  return (
    <section
      className="relative h-[78svh] min-h-[520px] overflow-hidden bg-ink text-white lg:h-[86vh]"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
    >
      {slides.map((s, i) => {
        const active = i === index
        const dark = s.textTone === 'dark'
        return (
          <div
            key={s.id}
            className={cn('absolute inset-0 transition-opacity duration-1000', active ? 'z-10 opacity-100' : 'z-0 opacity-0')}
            aria-hidden={!active}
            role="group"
            aria-label={`Slide ${i + 1} of ${count}`}
          >
            <HeroMedia slide={s} active={active} priority={i === 0} />
            <div className={cn('absolute inset-0', dark ? 'bg-gradient-to-r from-white/70 via-white/20 to-transparent' : 'bg-gradient-to-r from-black/70 via-black/25 to-transparent')} />
            <div className="container-x relative flex h-full flex-col justify-end pb-20 lg:justify-center lg:pb-0">
              <div className={cn('max-w-2xl', dark ? 'text-ink' : 'text-white')}>
                {s.eyebrow ? (
                  <p className={cn('mb-4 text-sm font-bold tracking-[0.3em] text-teal transition-all delay-200 duration-700', active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0')}>
                    {s.eyebrow}
                  </p>
                ) : null}
                <h2
                  className={cn(
                    'display text-[13vw] leading-[0.88] transition-all delay-300 duration-1000 ease-out-expo sm:text-7xl lg:text-[104px]',
                    active ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
                  )}
                >
                  {s.title}
                </h2>
                {s.subtitle ? (
                  <p className={cn('mt-5 max-w-lg text-lg transition-all delay-500 duration-1000', dark ? 'text-ink/80' : 'text-white/85', active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0')}>
                    {s.subtitle}
                  </p>
                ) : null}
                {s.ctaLink ? (
                  <div className={cn('mt-8 transition-all delay-700 duration-1000', active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0')}>
                    <Link href={s.ctaLink} className={cn('btn px-8 py-4 text-base', dark ? 'btn-primary' : 'btn-white')} tabIndex={active ? 0 : -1}>
                      {s.ctaLabel || 'Shop now'}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-6 z-20">
          <div className="container-x flex items-center justify-between">
            <div className="flex gap-2">
              {slides.map((s, i) => (
                <button key={s.id} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} className="group relative h-1 w-10 overflow-hidden rounded-full bg-white/30 sm:w-16">
                  <span
                    key={i === index ? `active-${index}` : `idle-${i}`}
                    className="absolute inset-y-0 left-0 bg-white"
                    style={
                      i === index
                        ? { width: '100%', transformOrigin: 'left', animation: `hero-progress ${INTERVAL}ms linear both`, animationPlayState: paused ? 'paused' : 'running' }
                        : { width: i < index ? '100%' : '0%' }
                    }
                  />
                </button>
              ))}
            </div>
            <div className="hidden gap-2 sm:flex">
              <button onClick={() => go(index - 1)} aria-label="Previous slide" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 backdrop-blur transition hover:bg-white hover:text-ink">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => go(index + 1)} aria-label="Next slide" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 backdrop-blur transition hover:bg-white hover:text-ink">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function HeroMedia({ slide, active, priority }: { slide: HeroSlide; active: boolean; priority: boolean }) {
  const media = slide.media
  if (!media) return <div className="absolute inset-0 bg-gradient-to-br from-teal-dark to-ink" />
  const cls = cn('object-cover transition-transform duration-[8000ms] ease-out', active ? 'scale-105' : 'scale-100')
  return (
    <>
      {media.type === 'video' ? (
        <video className={cn('absolute inset-0 h-full w-full', cls, slide.mobileMedia && 'hidden md:block')} src={media.url} autoPlay muted loop playsInline preload={priority ? 'auto' : 'none'} />
      ) : (
        <Image src={media.url} alt={media.alt ?? ''} fill priority={priority} sizes="100vw" className={cn(cls, slide.mobileMedia && 'hidden md:block')} unoptimized={media.url.endsWith('.gif')} />
      )}
      {slide.mobileMedia ? (
        slide.mobileMedia.type === 'video' ? (
          <video className={cn('absolute inset-0 h-full w-full md:hidden', cls)} src={slide.mobileMedia.url} autoPlay muted loop playsInline />
        ) : (
          <Image src={slide.mobileMedia.url} alt="" fill priority={priority} sizes="100vw" className={cn(cls, 'md:hidden')} />
        )
      ) : null}
    </>
  )
}
