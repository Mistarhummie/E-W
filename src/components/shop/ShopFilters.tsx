'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useState, useTransition } from 'react'

import { cn } from '../../lib/cn'

type Option = { label: string; value: string }

export function ShopFilters({
  categories,
  sizes,
  total,
  children,
}: {
  categories: Option[]
  sizes: string[]
  total: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value == null || value === '' || next.get(key) === value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  const active = ['category', 'size', 'gender', 'tag', 'max', 'q', 'training'].filter((k) => params.get(k))

  const panel = (
    <div className="grid gap-8">
      {categories.length ? (
        <FilterGroup title="Category">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c.value} className="chip text-xs" aria-pressed={params.get('category') === c.value} onClick={() => set('category', c.value)}>
                {c.label}
              </button>
            ))}
          </div>
        </FilterGroup>
      ) : null}
      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button key={s} className="chip text-xs" aria-pressed={params.get('size') === s} onClick={() => set('size', s)}>
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="For">
        <div className="flex flex-wrap gap-2">
          {[
            ['Men', 'men'],
            ['Women', 'women'],
            ['Kids', 'kids'],
          ].map(([l, v]) => (
            <button key={v} className="chip text-xs" aria-pressed={params.get('gender') === v} onClick={() => set('gender', v)}>
              {l}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="flex flex-wrap gap-2">
          {[
            ['Under KSH 1,500', '1500'],
            ['Under KSH 2,500', '2500'],
            ['Under KSH 4,000', '4000'],
          ].map(([l, v]) => (
            <button key={v} className="chip text-xs" aria-pressed={params.get('max') === v} onClick={() => set('max', v)}>
              {l}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Show">
        <div className="flex flex-wrap gap-2">
          {[
            ['New in', 'new'],
            ['Deals', 'deal'],
            ['Trending', 'trending'],
          ].map(([l, v]) => (
            <button key={v} className="chip text-xs" aria-pressed={params.get('tag') === v} onClick={() => set('tag', v)}>
              {l}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  )

  return (
    <>
      <div className="sticky top-16 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[72px] lg:-mx-10 lg:px-10">
        <button className="btn btn-outline px-4 py-2 text-xs lg:hidden" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filter {active.length ? `(${active.length})` : ''}
        </button>
        <p className={cn('text-sm text-muted transition-opacity', pending && 'opacity-40')}>
          {total} {total === 1 ? 'product' : 'products'}
        </p>
        <div className="no-scrollbar hidden flex-1 gap-2 overflow-x-auto lg:flex">
          {active.map((k) => (
            <button key={k} onClick={() => set(k, null)} className="flex shrink-0 items-center gap-1 rounded-full bg-mist px-3 py-1.5 text-xs font-semibold hover:bg-line">
              {params.get(k)} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Sort</span>
          <select className="rounded-full border border-line bg-white px-3 py-2 text-sm font-medium outline-none focus:border-teal" value={params.get('sort') ?? ''} onChange={(e) => set('sort', e.target.value || null)}>
            <option value="">Featured</option>
            <option value="new">Newest</option>
            <option value="popular">Best selling</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-36">{panel}</div>
        </aside>
        <div className={cn('transition-opacity duration-300', pending && 'opacity-50')}>{children}</div>
      </div>

      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
        <div className={cn('absolute inset-0 bg-black/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <div className={cn('absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 transition-transform duration-500 ease-out-expo', open ? 'translate-y-0' : 'translate-y-full')}>
          <div className="mb-6 flex items-center justify-between">
            <p className="display text-2xl">Filter</p>
            <button onClick={() => setOpen(false)} aria-label="Close filters">
              <X className="h-6 w-6" />
            </button>
          </div>
          {panel}
          <button className="btn btn-primary mt-8 w-full" onClick={() => setOpen(false)}>
            Show {total} products
          </button>
        </div>
      </div>
    </>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold tracking-[0.2em] text-muted uppercase">{title}</p>
      {children}
    </div>
  )
}
