'use client'

import React, { useState } from 'react'

import { cn } from '../../lib/cn'

/** Women / Men switcher for the "Popular right now" gym rail. Panels are server-rendered. */
export function GymTabs({ panels }: { panels: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      <div role="tablist" className="mb-6 inline-flex rounded-full bg-mist p-1">
        {panels.map((p, i) => (
          <button
            key={p.label}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={cn('rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300', active === i ? 'bg-ink text-white shadow' : 'text-ink hover:text-teal-dark')}
          >
            {p.label}
          </button>
        ))}
      </div>
      {panels.map((p, i) => (
        <div key={p.label} role="tabpanel" hidden={active !== i} className={active === i ? 'animate-fade-up' : undefined}>
          {p.content}
        </div>
      ))}
    </div>
  )
}
