import { Request, Response } from 'express';
import { env } from '../config/env';
import { safeEqual } from '../utils/pin';

/**
 * POST /api/access/verify  body { pin }  ->  { ok: boolean }
 * The PIN lives only in server env (EDIT_PIN) and is never exposed to the
 * client, so it cannot be discovered from the page source or dev tools.
 */
export const verifyEditAccess = async (req: Request, res: Response): Promise<void> => {
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
  res.json({ ok: safeEqual(pin, env.EDIT_PIN) });
};
