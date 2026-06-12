const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"

/**
 * Resolve the `User.avatar` field (which the backend stores as a relative
 * path like `/uploads/avatars/<id>.png?v=...`) into a fully-qualified URL
 * the browser can load. Pass-through for absolute URLs so existing data
 * with `https://...` avatars still works.
 *
 * Returns null when no avatar is set so callers can fall back to a
 * placeholder.
 */
export function avatarUrl(
  avatar: string | null | undefined,
): string | null {
  if (!avatar) return null
  if (/^https?:\/\//i.test(avatar)) return avatar
  if (avatar.startsWith("/")) return `${API_BASE}${avatar}`
  return avatar
}
