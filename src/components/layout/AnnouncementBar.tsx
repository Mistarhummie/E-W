'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export function AnnouncementBar({ messages }: { messages: { text: string; link?: string | null }[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (messages.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 4500)
    return () => clearInterval(t)
  }, [messages.length])
  if (!messages.length) return null
  return (
    <div className="relative z-40 h-9 overflow-hidden bg-teal text-white">
      {messages.map((m, idx) => {
        const inner = <span className="text-[13px] font-semibold tracking-wide">{m.text}</span>
        return (
          <div
            key={idx}
            aria-hidden={idx !== i}
            className="absolute inset-0 flex items-center justify-center px-4 text-center transition-all duration-500"
            style={{ transform: `translateY(${(idx - i) * 100}%)`, opacity: idx === i ? 1 : 0 }}
          >
            {m.link ? (
              <Link href={m.link} className="hover:underline" tabIndex={idx === i ? 0 : -1}>
                {inner}
              </Link>
            ) : (
              inner
            )}
          </div>
        )
      })}
    </div>
  )
}
