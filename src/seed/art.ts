/**
 * Draws simple jersey and banner artwork for the demo catalogue, so the site
 * can be previewed before real product photos are loaded.
 */

type Kit = { base: string; accent: string; trim?: string; pattern?: 'stripes' | 'hoops' | 'sash' | 'halves' | 'plain' | 'chevron' }

const shirtPath = 'M250 120 Q400 175 550 120 L720 215 L665 400 L600 372 L600 940 Q400 975 200 940 L200 372 L135 400 L80 215 Z'

function pattern(kit: Kit) {
  switch (kit.pattern) {
    case 'stripes':
      return Array.from({ length: 7 }, (_, i) => `<rect x="${200 + i * 60}" y="100" width="30" height="900" fill="${kit.accent}"/>`).join('')
    case 'hoops':
      return Array.from({ length: 8 }, (_, i) => `<rect x="0" y="${330 + i * 90}" width="800" height="45" fill="${kit.accent}"/>`).join('')
    case 'sash':
      return `<path d="M120 200 L280 120 L700 900 L540 980 Z" fill="${kit.accent}"/>`
    case 'halves':
      return `<rect x="400" y="100" width="400" height="900" fill="${kit.accent}"/>`
    case 'chevron':
      return `<path d="M200 380 L400 520 L600 380 L600 460 L400 600 L200 460 Z" fill="${kit.accent}"/>`
    default:
      return ''
  }
}

export function jerseySvg(kit: Kit, opts: { back?: boolean; crest?: string } = {}) {
  const trim = kit.trim ?? kit.accent
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="1200" height="1500">
  <defs>
    <clipPath id="shirt"><path d="${shirtPath}"/></clipPath>
    <linearGradient id="shade" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.18"/>
      <stop offset="0.25" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.75" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.18"/>
    </linearGradient>
    <radialGradient id="bg" cx="0.5" cy="0.45" r="0.7">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#eceeee"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <ellipse cx="400" cy="965" rx="230" ry="18" fill="#000" opacity="0.08"/>
  <g clip-path="url(#shirt)">
    <rect width="800" height="1000" fill="${kit.base}"/>
    ${pattern(kit)}
    <rect width="800" height="1000" fill="url(#shade)"/>
  </g>
  <path d="${shirtPath}" fill="none" stroke="#000" stroke-opacity="0.08" stroke-width="3"/>
  ${opts.back
    ? `<path d="M310 128 Q400 150 490 128" stroke="${trim}" stroke-width="16" fill="none" stroke-linecap="round"/>`
    : `<path d="M330 128 Q400 210 470 128" stroke="${trim}" stroke-width="16" fill="none" stroke-linecap="round"/>
       <circle cx="505" cy="300" r="34" fill="${trim}" opacity="0.95"/>
       <text x="505" y="310" font-family="Arial" font-weight="700" font-size="26" text-anchor="middle" fill="${kit.base}">${(opts.crest ?? '').slice(0, 3)}</text>
       <path d="M275 285 l18 -30 l18 30 z" fill="${trim}" opacity="0.9"/>`}
  <path d="M80 215 L135 400" stroke="${trim}" stroke-width="10"/>
  <path d="M720 215 L665 400" stroke="${trim}" stroke-width="10"/>
</svg>`
}

export function gymSvg(colour: string, kind: 'leggings' | 'shorts' | 'tank' | 'hoodie' | 'bra') {
  const shapes: Record<typeof kind, string> = {
    leggings: `<path d="M300 140 L500 140 L520 220 L560 900 L460 900 L405 330 L395 330 L340 900 L240 900 L280 220 Z" fill="${colour}"/><rect x="300" y="140" width="200" height="40" fill="#000" opacity="0.15"/>`,
    shorts: `<path d="M240 280 L560 280 L620 640 L440 660 L400 470 L360 660 L180 640 Z" fill="${colour}"/><rect x="240" y="280" width="320" height="40" fill="#000" opacity="0.15"/>`,
    tank: `<path d="M300 150 Q400 260 500 150 L540 160 L560 330 Q600 360 600 420 L600 880 Q400 910 200 880 L200 420 Q200 360 240 330 L260 160 Z" fill="${colour}"/>`,
    hoodie: `<path d="M280 160 Q400 90 520 160 L720 260 L680 640 L610 610 L610 900 Q400 930 190 900 L190 610 L120 640 L80 260 Z" fill="${colour}"/><path d="M300 170 Q400 300 500 170" stroke="#000" stroke-opacity="0.25" stroke-width="10" fill="none"/><rect x="300" y="600" width="200" height="110" rx="20" fill="#000" opacity="0.12"/>`,
    bra: `<path d="M240 300 Q300 250 330 200 L360 200 Q380 320 400 330 Q420 320 440 200 L470 200 Q500 250 560 300 L580 520 Q400 560 220 520 Z" fill="${colour}"/><rect x="220" y="480" width="360" height="45" fill="#000" opacity="0.15"/>`,
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="1200" height="1500">
  <defs><radialGradient id="bg" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#eceeee"/></radialGradient></defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <ellipse cx="400" cy="950" rx="230" ry="16" fill="#000" opacity="0.08"/>
  ${shapes[kind]}
  <path d="M640 120 L700 150 L640 180 Z" fill="#02B3AD"/>
</svg>`
}

export function bannerSvg(opts: { from: string; to: string; kit?: Kit; words?: string }) {
  const kit = opts.kit
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1100" width="2400" height="1320">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${opts.from}"/><stop offset="1" stop-color="${opts.to}"/></linearGradient>
    <clipPath id="shirt"><path d="${shirtPath}"/></clipPath>
  </defs>
  <rect width="2000" height="1100" fill="url(#g)"/>
  <text x="1980" y="1060" font-family="Arial Black, Arial" font-weight="900" font-size="420" text-anchor="end" fill="#fff" opacity="0.06">${opts.words ?? 'EASTWEST'}</text>
  <circle cx="1450" cy="520" r="380" fill="#fff" opacity="0.06"/>
  <path d="M1080 120 L1600 380 L1080 640 Z" fill="#02B3AD" opacity="0.35"/>
  <path d="M1350 560 L1700 735 L1350 910 Z" fill="#000" opacity="0.35"/>
  ${kit ? `<g transform="translate(1060 90) scale(0.95) rotate(-6 400 500)"><g clip-path="url(#shirt)"><rect width="800" height="1000" fill="${kit.base}"/>${pattern(kit)}</g><path d="M330 128 Q400 210 470 128" stroke="${kit.trim ?? kit.accent}" stroke-width="16" fill="none"/></g>` : ''}
</svg>`
}

export type { Kit }

/** Placeholder sleeve badge: a shield in the competition's colours with its short name. */
export function badgeSvg(label: string, colour: string, ink = '#ffffff', gold = false) {
  const size = label.length > 4 ? 46 : label.length > 2 ? 58 : 72
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <path d="M100 8 L180 36 L172 120 Q160 168 100 192 Q40 168 28 120 L20 36 Z" fill="${gold ? '#C9A227' : '#ffffff'}"/>
  <path d="M100 20 L168 44 L161 118 Q151 158 100 179 Q49 158 39 118 L32 44 Z" fill="${colour}"/>
  <text x="100" y="${118 + size * 0.05}" font-family="Arial Black, Arial" font-weight="900" font-size="${size}" text-anchor="middle" fill="${ink}">${label}</text>
</svg>`
}
