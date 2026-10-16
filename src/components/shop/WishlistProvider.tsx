'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type WishItem = { id: number | string; slug: string; title: string; image: string | null; price: number }

type WishlistContext = {
  items: WishItem[]
  has: (id: number | string) => boolean
  toggle: (item: WishItem) => void
}

const Ctx = createContext<WishlistContext | null>(null)
const KEY = 'ew-wishlist-v1'

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable after hydration
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items, loaded])

  const has = useCallback((id: number | string) => items.some((i) => String(i.id) === String(id)), [items])
  const toggle = useCallback(
    (item: WishItem) =>
      setItems((prev) => (prev.some((i) => String(i.id) === String(item.id)) ? prev.filter((i) => String(i.id) !== String(item.id)) : [item, ...prev])),
    [],
  )
  const value = useMemo(() => ({ items, has, toggle }), [items, has, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWishlist() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
