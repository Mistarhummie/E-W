export function WhatsAppButton({ number }: { number: string }) {
  const href = `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent('Hi EastWest! I have a question about')}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-110 active:scale-95 sm:right-6 sm:bottom-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20 group-hover:hidden" />
      <svg viewBox="0 0 32 32" className="relative h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M16.04 3C9 3 3.3 8.7 3.3 15.73c0 2.25.6 4.45 1.73 6.38L3.2 28.8l6.85-1.8a12.7 12.7 0 0 0 5.99 1.52h.01c7.03 0 12.74-5.7 12.74-12.73C28.79 8.7 23.08 3 16.04 3zm0 23.3h-.01a10.6 10.6 0 0 1-5.39-1.48l-.39-.23-4.06 1.07 1.08-3.96-.25-.4a10.56 10.56 0 0 1-1.62-5.58c0-5.85 4.76-10.6 10.62-10.6 5.85 0 10.6 4.75 10.6 10.6 0 5.85-4.76 10.6-10.58 10.6zm5.81-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.5-2.56-1.58-.95-.85-1.59-1.89-1.77-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64 0 1.56 1.14 3.06 1.3 3.27.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  )
}
