import type { Access, FieldAccess, PayloadRequest } from 'payload'

export const STAFF_ROLES = ['owner', 'manager', 'staff', 'writer'] as const
export type Role = (typeof STAFF_ROLES)[number] | 'customer'

type MaybeUser = { role?: Role | null; store?: unknown } | null | undefined

export const roleOf = (user: MaybeUser): Role | undefined => user?.role ?? undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]) => {
  const role = roleOf(user)
  return Boolean(role && roles.includes(role))
}

export const isStaff = (user: MaybeUser) => hasRole(user, ...STAFF_ROLES)

/** Owner only: sales figures, staff accounts, customer exports. */
export const ownerOnly: Access = ({ req }) => hasRole(req.user as MaybeUser, 'owner')

/** Catalogue, banners, codes, deliveries, settings. */
export const managers: Access = ({ req }) => hasRole(req.user as MaybeUser, 'owner', 'manager')

/** Blog posts and pages. Writers can draft; publishing is limited in the Posts hook. */
export const editors: Access = ({ req }) =>
  hasRole(req.user as MaybeUser, 'owner', 'manager', 'writer')

export const anyStaff: Access = ({ req }) => isStaff(req.user as MaybeUser)

export const anyone: Access = () => true

export const managersField: FieldAccess = ({ req }) =>
  hasRole(req.user as MaybeUser, 'owner', 'manager')

export const ownerField: FieldAccess = ({ req }) => hasRole(req.user as MaybeUser, 'owner')

export const staffField: FieldAccess = ({ req }) => isStaff(req.user as MaybeUser)

/** Published-only for the public; everything for staff. */
export const publishedOrStaff =
  (statusField = 'status', publishedValue = 'active'): Access =>
  ({ req }) => {
    if (isStaff(req.user as MaybeUser)) return true
    return { [statusField]: { equals: publishedValue } }
  }

export const storeIdOf = (req: PayloadRequest): number | string | undefined => {
  const store = (req.user as MaybeUser)?.store
  if (!store) return undefined
  if (typeof store === 'object' && store !== null && 'id' in store) {
    return (store as { id: number | string }).id
  }
  return store as number | string
}
