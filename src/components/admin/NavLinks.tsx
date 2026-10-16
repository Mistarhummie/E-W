import Link from 'next/link'
import React from 'react'

export const NavLinks = () => (
  <div style={{ padding: '12px 0', display: 'grid', gap: 6 }}>
    <Link href="/admin/print-queue" className="nav__link" style={{ fontWeight: 600 }}>
      🖨️ Print queue
    </Link>
    <Link href="/" className="nav__link" target="_blank">
      ↗ View website
    </Link>
  </div>
)
