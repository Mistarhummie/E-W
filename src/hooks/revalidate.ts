import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

/** Clears cached storefront pages after admin edits so changes show at once. */
async function clear(tags: string[]) {
  try {
    const { revalidateTag } = await import('next/cache')
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
  } catch {
    // Outside a Next.js request (seed scripts): nothing cached to clear.
  }
}

export const revalidateTags =
  (tags: string[]): CollectionAfterChangeHook =>
  async ({ doc }) => {
    await clear(tags)
    return doc
  }

export const revalidateTagsOnDelete =
  (tags: string[]): CollectionAfterDeleteHook =>
  async ({ doc }) => {
    await clear(tags)
    return doc
  }

export const revalidateGlobal =
  (tags: string[]): GlobalAfterChangeHook =>
  async ({ doc }) => {
    await clear(tags)
    return doc
  }
