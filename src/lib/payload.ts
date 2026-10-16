import 'server-only'

import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

export const getPayloadClient = () => getPayload({ config })

/** Signed-in shopper or staff member for the current request, or null. */
export async function getCurrentUser() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return user ?? null
}
