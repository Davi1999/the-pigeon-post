/**
 * Featured images are stored in the posts.content JSON as an object path
 * (e.g. "user_id/uuid.webp"), never as a raw URL. This keeps rendering
 * same-origin and prevents arbitrary remote images from being injected
 * through the post API.
 */
export const POST_IMAGE_PATH_PATTERN =
  /^[A-Za-z0-9_-]+\/[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/;

export function isPostImagePath(value: unknown): value is string {
  return typeof value === "string" && POST_IMAGE_PATH_PATTERN.test(value);
}

export function isPostImageOwnedByUser(
  path: string,
  userId: string,
): boolean {
  return isPostImagePath(path) && path.startsWith(`${userId}/`);
}
