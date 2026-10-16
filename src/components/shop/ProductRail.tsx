'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import React, { useRef } from 'react'

/** Horizontal, swipeable row of product cards with arrow buttons on desktop. */
export function ProductRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <div className="group/rail relative">
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10">
        {React.Children.map(children, (child) => (
          <div className="w-[64%] shrink-0 snap-start sm:w-[38%] lg:w-[23%]">{child}</div>
        ))}
      </div>
      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute top-[38%] -left-2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-all duration-300 group-hover/rail:opacity-100 hover:bg-ink hover:text-white lg:flex"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute top-[38%] -right-2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-all duration-300 group-hover/rail:opacity-100 hover:bg-ink hover:text-white lg:flex"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  )
}
