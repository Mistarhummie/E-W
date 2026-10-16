import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { type JSXConvertersFunction, RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

import type { Product } from '../../payload-types'
import { cn } from '../../lib/cn'
import { ProductCard } from '../shop/ProductCard'

type ShopBlock = { fields: { heading?: string; products?: (Product | number)[] } }

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    shopProducts: ({ node }: { node: ShopBlock }) => {
      const products = (node.fields.products ?? []).filter((p): p is Product => typeof p === 'object')
      if (!products.length) return null
      return (
        <div className="not-prose my-10 rounded-3xl bg-mist p-6">
          <p className="display mb-4 text-2xl">{node.fields.heading || 'Shop the kits'}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )
    },
  },
})

export function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!data) return null
  return <LexicalRichText data={data as SerializedEditorState} converters={converters} className={cn('prose-ew', className)} />
}
