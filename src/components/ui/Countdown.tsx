'use client'

import React, { useEffect, useState } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')

export function Countdown({ to, className }: { to: string; className?: string }) {
  const target = new Date(to).getTime()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock must start after hydration to avoid a mismatch
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, target - (now ?? target))
  const parts = [
    ['Days', Math.floor(left / 86400000)],
    ['Hrs', Math.floor(left / 3600000) % 24],
    ['Min', Math.floor(left / 60000) % 60],
    ['Sec', Math.floor(left / 1000) % 60],
  ] as const
  return (
    <div className={className} role="timer" aria-label="Time left on this deal">
      <div className="flex gap-2">
        {parts.map(([label, value]) => (
          <div key={label} className="flex w-16 flex-col items-center rounded-xl bg-ink py-2 text-white">
            <span key={value} className="display animate-pop text-2xl tabular-nums">{now == null ? '--' : pad(value)}</span>
            <span className="text-[10px] tracking-widest text-white/60 uppercase">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
