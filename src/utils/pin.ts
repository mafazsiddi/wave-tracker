import crypto from 'crypto';

/**
 * Constant-time string compare, so a PIN can't be recovered by timing how long
 * a wrong guess takes to be rejected.
 *
 * Shared by the edit-access check and the revision restore endpoint - both
 * gate on EDIT_PIN, and a second copy of this would be a second chance to get
 * it subtly wrong.
 */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
