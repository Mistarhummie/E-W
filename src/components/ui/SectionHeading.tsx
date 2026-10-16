import Link from 'next/link'

export function SectionHeading({ title, eyebrow, href, linkLabel = 'Shop all' }: { title: React.ReactNode; eyebrow?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-bold tracking-[0.25em] text-teal-dark uppercase">{eyebrow}</p> : null}
        <h2 className="display text-4xl leading-none sm:text-5xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="link-underline shrink-0 pb-1 text-sm font-semibold">
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  )
}
