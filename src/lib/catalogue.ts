/** Shared, client-safe catalogue constants. */

export const SIZE_GROUPS = {
  adult: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
  women: ['XS', 'S', 'M', 'L', 'XL'],
  kids: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y', '14Y'],
  onesize: ['One size'],
} as const

export type SizeGroup = keyof typeof SIZE_GROUPS

export const SECTIONS = {
  jerseys: 'Football jerseys',
  gym: 'Gym wear',
  kids: 'Kids',
  accessories: 'Accessories',
} as const

export type Section = keyof typeof SECTIONS

export const FONTS = [
  { value: 'league', label: 'League font', note: 'Official league lettering' },
  { value: 'team', label: 'Team font', note: "The club's own lettering" },
] as const

export type FontChoice = (typeof FONTS)[number]['value']

export const NAME_MAX = 12
export const NAME_PATTERN = /^[A-Z .'-]{1,12}$/
export const NUMBER_PATTERN = /^\d{1,2}$/

export const cleanPrintName = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z .'-]/g, '')
    .slice(0, NAME_MAX)

export const cleanPrintNumber = (raw: string) => raw.replace(/\D/g, '').slice(0, 2)

export const TRAINING_TYPES = [
  { value: 'gym', label: 'Gym & lifting' },
  { value: 'running', label: 'Running' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'football', label: 'Football training' },
  { value: 'yoga', label: 'Yoga & pilates' },
] as const

export const formatKsh = (amount: number) => `KSH ${Math.round(amount).toLocaleString('en-KE')}`
