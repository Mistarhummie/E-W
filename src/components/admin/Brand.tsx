import React from 'react'

export const AdminLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/brand/logo.png" alt="EastWest Fashions" width={120} height={108} />
  </div>
)

export const AdminIcon = () => (
  <svg viewBox="0 0 40 40" width={28} height={28} aria-label="EastWest">
    <path d="M6 4 L34 18 L6 32 Z" fill="#02B3AD" />
    <path d="M20 22 L36 30 L20 38 Z" fill="currentColor" />
  </svg>
)
