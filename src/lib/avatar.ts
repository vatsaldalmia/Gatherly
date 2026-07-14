// Every account used to render the same avatar: email/password signups leave `user.image`
// null, so every one of them fell through to an identical grey placeholder. A picture is
// resolved in three steps, best first:
//
//   1. `user.image`  — the photo the OAuth provider (Google) handed us at sign-in.
//   2. Gravatar      — many emails already have a picture attached to them; ask for it with
//                      `d=404` so an email with no Gravatar fails the image load rather than
//                      returning Gravatar's own generic placeholder (which would put us back
//                      where we started: one shared image for everyone).
//   3. Generated     — a colour derived from the person's own id/email. Not a photo, but it
//                      is *theirs*: two accounts are overwhelmingly unlikely to collide.
//
// Steps 2 and 3 both key off a stable seed, so the same person keeps the same avatar across
// sessions and devices.

/** FNV-1a. Small, stable across runtimes, and well spread for short strings like ids. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Initials for the generated avatar. Falls back to the email local-part, then to "?" . */
export function initialsOf(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * A deterministic gradient for `seed`. Hues are pushed 40° apart so the two stops always read
 * as one colour rather than a muddy blend, and saturation/lightness are pinned to a range that
 * keeps white initials legible in both themes.
 */
export function generatedAvatar(seed: string): { backgroundImage: string } {
  const h = hash(seed);
  const hue = h % 360;
  const spread = 40;
  return {
    backgroundImage: `linear-gradient(135deg, hsl(${hue} 65% 52%), hsl(${(hue + spread) % 360} 70% 42%))`,
  };
}

/**
 * Gravatar's URL for an email, or null if we can't hash it (no Web Crypto — i.e. during SSR,
 * where this returns null and the client fills it in on hydration).
 *
 * Gravatar keys off the SHA-256 of the trimmed, lowercased address. `d=404` is what makes the
 * chain work: without it Gravatar always answers 200 with a generic image.
 */
export async function gravatarUrl(email: string): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  const normalized = email.trim().toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `https://www.gravatar.com/avatar/${hex}?s=200&d=404`;
}
