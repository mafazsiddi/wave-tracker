import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';

/**
 * Key-value store backing the Wave Tracker frontend's window.storage.
 * Keys are arbitrary strings (e.g. "meta", "qdata:JAS'26", "comments:JAS'26")
 * and values are JSON strings. Shared across the whole team.
 *
 * Every key holds ONE blob for the whole team, so two people editing different
 * things at the same time were both writing a full copy of it - whoever saved
 * last silently erased everything the other had added since their page loaded.
 * To stop that, a read hands back a `version` (an md5 of the stored value) and
 * a write may pass it back: the write then only lands if the stored value is
 * still the one the caller started from, and otherwise comes back 409 with the
 * current value so the caller can merge and retry. Writes that send no
 * `version` keep the old unconditional behaviour.
 */

const versionOf = (value: string): string =>
  crypto.createHash('md5').update(value, 'utf8').digest('hex');

// GET /api/kv/:key  ->  { value: string | null, version: string | null }
export const getKV = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const row = await prisma.kVStore.findUnique({ where: { key } });
    res.json({
      value: row ? row.value : null,
      version: row ? versionOf(row.value) : null,
    });
  } catch (error: any) {
    res.status(500).json({ value: null, version: null, error: error.message });
  }
};

// Current state of a key, shaped for a 409 body.
const currentOf = async (key: string) => {
  const row = await prisma.kVStore.findUnique({ where: { key } });
  return {
    value: row ? row.value : null,
    version: row ? versionOf(row.value) : null,
  };
};

// PUT /api/kv/:key
//   body { value }                  -> unconditional write (legacy callers)
//   body { value, version: string } -> only overwrites that exact version
//   body { value, version: null }   -> only creates a key that doesn't exist yet
// 200 { success: true, version } on success, 409 { conflict: true, value, version } on a clash.
export const putKV = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const value = String(req.body?.value ?? '');
    const body = req.body ?? {};

    if (!('version' in body)) {
      await prisma.kVStore.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      res.json({ success: true, version: versionOf(value) });
      return;
    }

    if (body.version === null) {
      // Caller believes this key is brand new; let the primary key enforce it.
      try {
        await prisma.kVStore.create({ data: { key, value } });
        res.json({ success: true, version: versionOf(value) });
      } catch {
        res.status(409).json({ success: false, conflict: true, ...(await currentOf(key)) });
      }
      return;
    }

    // Compare-and-set in a single statement so two simultaneous writers can't
    // both pass the check - md5() is evaluated by Postgres against the row as
    // it is at write time, and only one of them can match.
    const expected = String(body.version);
    const updated: number = await prisma.$executeRaw`
      UPDATE "KVStore"
      SET "value" = ${value}, "updatedAt" = NOW()
      WHERE "key" = ${key} AND md5("value") = ${expected}
    `;

    if (updated === 0) {
      res.status(409).json({ success: false, conflict: true, ...(await currentOf(key)) });
      return;
    }
    res.json({ success: true, version: versionOf(value) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /api/kv/:key  ->  { success: true }
export const deleteKV = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    await prisma.kVStore.deleteMany({ where: { key } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
