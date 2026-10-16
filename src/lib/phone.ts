/** 0712 345 678 / +254712345678 / 712345678 → 254712345678 */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) return `254${digits}`
  return digits
}

export const isKenyanMobile = (raw: string) => /^254(7|1)\d{8}$/.test(normalisePhone(raw))

export const formatPhone = (raw: string) => {
  const p = normalisePhone(raw)
  return p.length === 12 ? `+${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}` : raw
}
