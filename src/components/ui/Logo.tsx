import { cn } from '../../lib/cn'

/** Wordmark built from the brand colours. Replace with the redrawn SVG once approved. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-brand leading-none select-none', className)}>
      <svg viewBox="0 0 40 40" className="h-[1.6em] w-[1.6em] shrink-0" aria-hidden>
        <path d="M5 3 L33 17 L5 31 Z" fill="#02B3AD" />
        <path d="M20 22 L37 30.5 L20 39 Z" fill={inverted ? '#fff' : '#0b0b0c'} />
      </svg>
      <span className="flex flex-col">
        <span className="text-[1.15em] font-bold tracking-tight">
          <span className={inverted ? 'text-white' : 'text-ink'}>east</span>
          <span className="text-teal">west</span>
        </span>
        <span className={cn('text-[0.42em] font-medium tracking-[0.42em]', inverted ? 'text-white/70' : 'text-ink/70')}>
          FASHIONS
        </span>
      </span>
      <span className="sr-only">EastWest Fashions Ke</span>
    </span>
  )
}
