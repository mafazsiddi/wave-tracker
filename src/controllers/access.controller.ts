import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

/** Constant-time string compare so the PIN can't be guessed via response timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * POST /api/access/verify  body { pin }  ->  { ok: boolean }
 * The PIN lives only in server env (EDIT_PIN) and is never exposed to the
 * client, so it cannot be discovered from the page source or dev tools.
 */
export const verifyEditAccess = async (req: Request, res: Response): Promise<void> => {
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
  res.json({ ok: safeEqual(pin, env.EDIT_PIN) });
};
