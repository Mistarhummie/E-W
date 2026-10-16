'use client'

import { Check, Minus, Plus, Ruler, ShoppingBag, Sparkles } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'

import { cleanPrintName, cleanPrintNumber, FONTS, formatKsh, NAME_MAX } from '../../lib/catalogue'
import { cn } from '../../lib/cn'
import { percentOff, printPriceFor, unitPriceFor, wasPriceFor, type PricedProduct } from '../../lib/pricing'
import { Price } from '../ui/Price'
import { useCart } from './CartProvider'
import { ShirtPreview } from './ShirtPreview'

export type ConfigProduct = PricedProduct & {
  id: number | string
  slug: string
  title: string
  image: string | null
  sizes: string[]
  trackStock: boolean
  stock: { edition: string | null; size: string; stock: number }[]
  preorder: boolean
  shipsBy?: string | null
  customisable: boolean
  badges: { id: number | string; name: string; price: number; group: 'league' | 'competition' }[]
  namePrice: number
  numberPrice: number
  backImage: string | null
  nameColour: string
}

export function ProductConfigurator({ product }: { product: ConfigProduct }) {
  const { add } = useCart()
  const editions = product.editions ?? []
  const [edition, setEdition] = useState<string | null>(editions[0]?.name ?? null)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [custom, setCustom] = useState(false)
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [font, setFont] = useState<string>('league')
  const [badgeIds, setBadgeIds] = useState<Record<string, string | number | null>>({ league: null, competition: null })
  const [confirmed, setConfirmed] = useState(false)
  const [added, setAdded] = useState(false)

  const stockOf = (s: string) => {
    if (!product.trackStock) return Infinity
    const row = product.stock.find((r) => r.size === s && (r.edition ?? null) === edition) ?? product.stock.find((r) => r.size === s && !r.edition)
    return row?.stock ?? 0
  }

  const price = unitPriceFor(product, edition)
  const was = wasPriceFor(product, edition)
  const chosenBadges = product.badges.filter((b) => Object.values(badgeIds).map(String).includes(String(b.id)))
  const print = custom ? { name: name.trim(), number, font, badgeIds: chosenBadges.map((b) => b.id) } : undefined
  const printPrice = useMemo(
    () => printPriceFor(print, { namePrice: product.namePrice, numberPrice: product.numberPrice }, product.badges),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [custom, name, number, chosenBadges.length, product],
  )
  const hasPrint = Boolean(custom && (name.trim() || number || chosenBadges.length))
  const sizeStock = size ? stockOf(size) : Infinity
  const isPreorder = size != null && sizeStock < qty && product.preorder
  const blocked = size != null && sizeStock < qty && !product.preorder

  const addToCart = () => {
    if (!size) {
      setSizeError(true)
      document.getElementById('size-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (hasPrint && !confirmed) {
      document.getElementById('confirm-spelling')?.focus()
      return
    }
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.image,
      edition,
      size,
      quantity: qty,
      unitPrice: price,
      printPrice: hasPrint ? printPrice : 0,
      print: hasPrint ? { name: name.trim(), number, font: name || number ? font : undefined, badgeIds: chosenBadges.map((b) => b.id), badgeNames: chosenBadges.map((b) => b.name) } : null,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const off = percentOff(price, was)

  return (
    <div className="grid gap-7">
      <div>
        <div className="flex items-center gap-3">
          <Price price={price} was={was} size="lg" />
          {off ? <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-white">SAVE {off}%</span> : null}
        </div>
        {hasPrint ? (
          <p className="mt-1 animate-fade-up text-sm text-muted">
            + {formatKsh(printPrice)} customisation = <strong className="text-ink">{formatKsh(price + printPrice)}</strong> each
          </p>
        ) : null}
      </div>

      {editions.length > 1 ? (
        <fieldset>
          <legend className="label">
            Edition: <span className="text-teal-dark">{edition}</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {editions.map((e) => (
              <button
                key={e.name}
                type="button"
                aria-pressed={edition === e.name}
                onClick={() => setEdition(e.name)}
                className="chip flex-col items-start gap-0.5 px-4 py-3 text-left"
              >
                <span className="font-semibold">{e.name}</span>
                <span className="text-xs opacity-70">{formatKsh(e.price)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset id="size-picker">
        <div className="mb-1.5 flex items-center justify-between">
          <legend className="label mb-0">
            Size{size ? <>: <span className="text-teal-dark">{size}</span></> : null}
          </legend>
          <Link href="/size-guide" className="flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline">
            <Ruler className="h-3.5 w-3.5" /> Size guide
          </Link>
        </div>
        <div className={cn('flex flex-wrap gap-2 rounded-xl transition-all', sizeError && !size && 'animate-[pop_0.3s] ring-2 ring-sale ring-offset-4')}>
          {product.sizes.map((s) => {
            const left = stockOf(s)
            const out = left <= 0 && !product.preorder
            return (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                aria-disabled={out}
                onClick={() => {
                  if (out) return
                  setSize(s)
                  setSizeError(false)
                }}
                className="chip relative min-w-14"
                title={out ? 'Sold out' : undefined}
              >
                {s}
                {!out && left > 0 && left <= 3 ? <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-deal ring-2 ring-white" /> : null}
              </button>
            )
          })}
        </div>
        {sizeError && !size ? <p className="mt-2 text-sm font-medium text-sale">Please choose a size.</p> : null}
        {size && sizeStock > 0 && sizeStock <= 3 ? <p className="mt-2 text-sm font-medium text-amber-600">Only {sizeStock} left in {size}</p> : null}
        {isPreorder ? <p className="mt-2 text-sm font-medium text-teal-dark">Pre-order{product.shipsBy ? `: ships by ${new Date(product.shipsBy).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}` : ''}</p> : null}
      </fieldset>

      {product.customisable ? (
        <div className={cn('overflow-hidden rounded-2xl border transition-all duration-500', custom ? 'border-teal bg-teal-light/40' : 'border-line')}>
          <button type="button" onClick={() => setCustom((c) => !c)} aria-expanded={custom} className="flex w-full items-center gap-3 p-4 text-left">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors', custom ? 'bg-teal text-white' : 'bg-mist')}>
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Add name, number & badges</span>
              <span className="block text-xs text-muted">
                Name {formatKsh(product.namePrice)} · Number {formatKsh(product.numberPrice)} · Fonts free · Printed overnight
              </span>
            </span>
            <span className={cn('relative h-6 w-11 rounded-full transition-colors', custom ? 'bg-teal' : 'bg-line')}>
              <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ease-spring', custom ? 'left-[22px]' : 'left-0.5')} />
            </span>
          </button>

          <div className={cn('grid transition-all duration-500 ease-out-expo', custom ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="overflow-hidden">
              <div className="grid gap-5 px-4 pb-5 sm:grid-cols-[1fr_180px]">
                <div className="grid gap-4">
                  <div className="grid grid-cols-[1fr_96px] gap-3">
                    <label>
                      <span className="label">Name ({name.length}/{NAME_MAX})</span>
                      <input
                        className="field uppercase"
                        value={name}
                        placeholder="e.g. ONYANGO"
                        autoComplete="off"
                        onChange={(e) => {
                          setName(cleanPrintName(e.target.value))
                          setConfirmed(false)
                        }}
                      />
                    </label>
                    <label>
                      <span className="label">Number</span>
                      <input
                        className="field text-center text-lg font-bold"
                        value={number}
                        inputMode="numeric"
                        placeholder="10"
                        onChange={(e) => {
                          setNumber(cleanPrintNumber(e.target.value))
                          setConfirmed(false)
                        }}
                      />
                    </label>
                  </div>

                  <fieldset>
                    <legend className="label">Font</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {FONTS.map((f) => (
                        <button key={f.value} type="button" aria-pressed={font === f.value} onClick={() => setFont(f.value)} className="chip flex-col items-start px-3 py-2 text-left">
                          <span className="text-sm font-semibold">{f.label}</span>
                          <span className="text-[11px] opacity-70">Free</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {(['league', 'competition'] as const).map((group) => {
                    const options = product.badges.filter((b) => b.group === group)
                    if (!options.length) return null
                    return (
                      <fieldset key={group}>
                        <legend className="label">{group === 'league' ? 'League badge' : 'Competition badge'} (pick one)</legend>
                        <div className="grid gap-1.5">
                          {options.map((b) => {
                            const on = String(badgeIds[group]) === String(b.id)
                            return (
                              <button
                                key={b.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => setBadgeIds((prev) => ({ ...prev, [group]: on ? null : b.id }))}
                                className={cn('flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-all', on ? 'border-ink bg-white shadow-sm' : 'border-line bg-white/60 hover:border-ink/40')}
                              >
                                <span className="flex items-center gap-2.5">
                                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all', on ? 'border-teal bg-teal text-white' : 'border-line')}>
                                    {on ? <Check className="h-3 w-3" /> : null}
                                  </span>
                                  {b.name}
                                </span>
                                <span className="text-xs font-semibold text-teal-dark">+{formatKsh(b.price)}</span>
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                    )
                  })}
                </div>

                <div className="order-first sm:order-none">
                  <ShirtPreview
                    name={name}
                    number={number}
                    font={font}
                    colour={product.nameColour}
                    backImage={product.backImage}
                    badges={chosenBadges.map((b) => b.name.replace(/ Badge.*$/, ''))}
                    className="mx-auto max-w-[220px] sm:sticky sm:top-28"
                  />
                </div>
              </div>

              {hasPrint ? (
                <label className="mx-4 mb-5 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 text-sm">
                  <input id="confirm-spelling" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 accent-teal" />
                  <span>
                    I confirm the spelling is correct. <span className="text-muted">Printed shirts can&apos;t be returned.</span>
                  </span>
                </label>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3">
        <div className="flex items-center rounded-full border border-line">
          <button type="button" className="p-3.5 hover:text-teal" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-semibold" aria-live="polite">{qty}</span>
          <button type="button" className="p-3.5 hover:text-teal" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={addToCart}
          disabled={blocked}
          className={cn('btn flex-1 py-4 text-base', added ? 'bg-teal text-white' : 'btn-primary')}
        >
          {added ? (
            <>
              <Check className="h-5 w-5 animate-pop" /> Added
            </>
          ) : blocked ? (
            'Sold out in this size'
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" /> {isPreorder ? 'Pre-order' : 'Add to cart'} · {formatKsh((price + (hasPrint ? printPrice : 0)) * qty)}
            </>
          )}
        </button>
      </div>
      {hasPrint && !confirmed ? <p className="-mt-4 text-xs text-muted">Tick the spelling box above to add this shirt.</p> : null}
    </div>
  )
}
