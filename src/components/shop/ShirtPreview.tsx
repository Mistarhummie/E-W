import { cn } from '../../lib/cn'

/**
 * Back-of-shirt preview. Uses the product's back photo when there is one,
 * otherwise a drawn shirt in the brand colour.
 */
export function ShirtPreview({
  name,
  number,
  font = 'league',
  colour = '#ffffff',
  shirtColour = '#0b0b0c',
  backImage,
  badges = [],
  className,
}: {
  name?: string
  number?: string
  font?: string
  colour?: string
  shirtColour?: string
  backImage?: string | null
  badges?: string[]
  className?: string
}) {
  const nameText = (name || 'YOUR NAME').toUpperCase()
  const numberText = number || '10'
  const placeholder = !name && !number
  const family = font === 'team' ? "'Oswald', 'Arial Narrow', sans-serif" : "'Inter', 'Arial', sans-serif"
  const nameSize = Math.max(22, Math.min(40, 360 / Math.max(nameText.length, 6)))
  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist', className)}>
      <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" role="img" aria-label={`Preview: ${nameText} ${numberText}`}>
        {backImage ? (
          <image href={backImage} x="0" y="0" width="400" height="500" preserveAspectRatio="xMidYMid slice" />
        ) : (
          <g>
            <path
              d="M120 40 Q200 70 280 40 L370 90 L340 190 L305 175 L305 470 Q200 485 95 470 L95 175 L60 190 L30 90 Z"
              fill={shirtColour}
            />
            <path d="M160 46 Q200 62 240 46" stroke="#02B3AD" strokeWidth="6" fill="none" />
            <path d="M30 90 L60 190 L95 175" stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
          </g>
        )}
        <defs>
          <path id="name-arc" d="M95 150 Q200 128 305 150" />
        </defs>
        <text
          fill={colour}
          fontFamily={family}
          fontWeight={font === 'team' ? 600 : 800}
          fontSize={nameSize}
          letterSpacing="3"
          textAnchor="middle"
          opacity={placeholder ? 0.35 : 1}
          style={{ transition: 'all 0.25s ease' }}
        >
          <textPath href="#name-arc" startOffset="50%">
            {nameText}
          </textPath>
        </text>
        <text
          x="200"
          y="330"
          fill={colour}
          fontFamily={family}
          fontWeight={font === 'team' ? 700 : 900}
          fontSize={font === 'team' ? 170 : 160}
          textAnchor="middle"
          opacity={placeholder ? 0.35 : 1}
          style={{ transition: 'all 0.25s ease' }}
        >
          {numberText}
        </text>
      </svg>
      {badges.length ? (
        <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1">
          {badges.map((b) => (
            <span key={b} className="animate-pop rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow">
              + {b}
            </span>
          ))}
        </div>
      ) : null}
      <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wider">BACK PREVIEW</span>
    </div>
  )
}
