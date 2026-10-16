'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartLine = {
  key: string
  productId: number | string
  slug: string
  title: string
  image: string | null
  edition: string | null
  size: string
  quantity: number
  unitPrice: number
  printPrice: number
  print: { name?: string; number?: string; font?: string; badgeIds?: (number | string)[]; badgeNames?: string[] } | null
}

type CartContext = {
  lines: CartLine[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (line: Omit<CartLine, 'key'>) => void
  update: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
  lastAdded: CartLine | null
}

const Ctx = createContext<CartContext | null>(null)
const STORAGE_KEY = 'ew-cart-v1'

const keyFor = (l: Omit<CartLine, 'key'>) =>
  [l.productId, l.edition ?? '', l.size, l.print?.name ?? '', l.print?.number ?? '', l.print?.font ?? '', (l.print?.badgeIds ?? []).join('.')].join('|')

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [open, setOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<CartLine | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable after hydration
      if (raw) setLines(JSON.parse(raw))
    } catch {
      // Private mode or blocked storage: cart lives in memory only.
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // ignore
    }
  }, [lines, loaded])

  const add = useCallback((line: Omit<CartLine, 'key'>) => {
    const key = keyFor(line)
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key)
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l))
      return [...prev, { ...line, key }]
    })
    setLastAdded({ ...line, key })
    setOpen(true)
  }, [])

  const update = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l)),
    )
  }, [])

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContext>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + (l.unitPrice + l.printPrice) * l.quantity, 0),
      open,
      setOpen,
      add,
      update,
      remove,
      clear,
      lastAdded,
    }),
    [lines, open, add, update, remove, clear, lastAdded],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
