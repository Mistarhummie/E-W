import { formatKsh } from '../../lib/catalogue'
import { cn } from '../../lib/cn'

export function Price({ price, was, className, size = 'md' }: { price: number; was?: number | null; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn('font-bold', size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-base', was ? 'text-sale' : 'text-ink')}>
        {formatKsh(price)}
      </span>
      {was ? <s className={cn('text-muted', size === 'lg' ? 'text-lg' : 'text-xs')}>{formatKsh(was)}</s> : null}
    </span>
  )
}
