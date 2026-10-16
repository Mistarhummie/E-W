import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="display text-[9rem] leading-none text-teal sm:text-[12rem]">404</p>
      <h1 className="display mt-2 text-4xl">Offside!</h1>
      <p className="mt-3 max-w-md text-muted">We couldn&apos;t find that page. It may have moved, or the kit may have sold out.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">
          Shop all
        </Link>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
    </div>
  )
}
