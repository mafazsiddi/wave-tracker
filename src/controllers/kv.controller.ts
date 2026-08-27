import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import { safeEqual } from '../utils/pin';

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

// How many past versions of a key to keep. Each one is a full copy of the
// blob, so this trades storage for how far back a restore can reach.
const MAX_REVISIONS = 40;

/**
 * Create the revision table if it isn't there, once per process.
 *
 * This project has no migrations directory - the schema is applied with
 * `prisma db push`, run by hand against whichever database the operator is
 * pointed at. That left production without KVRevision while history looked
 * fine locally: every write silently failed to record, and the gap only
 * surfaced when data went missing and there was nothing to restore from.
 *
 * Rather than depend on someone remembering to run a command against the right
 * database, the table asserts itself. Strictly additive - CREATE TABLE IF NOT
 * EXISTS touches nothing else - so it is safe against a database shared with
 * another application.
 */
let revisionTableReady: Promise<void> | null = null;
const ensureRevisionTable = (): Promise<void> => {
  if (!revisionTableReady) {
    revisionTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "KVRevision" (
          "id"        SERIAL PRIMARY KEY,
          "key"       TEXT NOT NULL,
          "value"     TEXT NOT NULL,
          "entries"   INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "KVRevision_key_createdAt_idx" ON "KVRevision"("key", "createdAt")`
      );
    })().catch((error: any) => {
      // Let the next call try again rather than caching the failure forever.
      revisionTableReady = null;
      console.error(`[kv] could not ensure KVRevision table: ${error.message}`);
    });
  }
  return revisionTableReady;
};

/**
 * Snapshot the value a key held *before* it is overwritten, then trim history.
 *
 * Never allowed to break the write it accompanies: history is a safety net, and
 * a net that takes the dashboard down when it tears is worse than no net. Any
 * failure here is logged and swallowed.
 */
const recordRevision = async (key: string, previousValue: string): Promise<void> => {
  try {
    await ensureRevisionTable();
    await prisma.kVRevision.create({
      data: { key, value: previousValue, entries: entryCount(previousValue) },
    });
    const stale = await prisma.kVRevision.findMany({
      where: { key },
      orderBy: { createdAt: 'desc' },
      skip: MAX_REVISIONS,
      select: { id: true },
    });
    if (stale.length) {
      await prisma.kVRevision.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } });
    }
  } catch (error: any) {
    console.error(`[kv] could not record revision for "${key}": ${error.message}`);
  }
};

// Number of rows in an `{entries:[...]}` blob, or null if this value isn't one.
const entryCount = (value: string): number | null => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed?.entries) ? parsed.entries.length : null;
  } catch {
    return null;
  }
};

// Below this, a key is too small for "most of it vanished" to mean anything.
const GUARD_MIN_ROWS = 20;
// A write keeping less than this share of the existing rows is refused.
const GUARD_KEEP_RATIO = 0.5;

/**
 * Refuse writes that would destroy most of a quarter's entries.
 *
 * The client sends the whole dataset on every save, so any bug that makes it
 * believe the quarter is empty - a failed GET, a bad merge, a sweep gone wrong
 * - turns the next save into a full erase. Two such bugs have already been
 * found and fixed in the frontend; this exists so a third one cannot destroy
 * data while it goes unnoticed.
 *
 * Deliberately server-side: it holds no matter what the page does, including
 * versions of the page still cached in someone's browser.
 *
 * Answers exactly like a version conflict (409 + the current value) rather
 * than a hard error, because the client already knows how to handle that: it
 * merges its own state into the server's copy and writes back. A genuine bulk
 * delete by a person is still possible, via `allowShrink: true`.
 */
const wouldDestroyData = (
  row: { value: string } | null,
  value: string,
  body: any
): { existing: number; incoming: number } | null => {
  if (body?.allowShrink === true) return null;
  const incoming = entryCount(value);
  if (incoming === null) return null;
  if (!row) return null;
  const existing = entryCount(row.value);
  if (existing === null || existing < GUARD_MIN_ROWS) return null;
  if (incoming >= Math.floor(existing * GUARD_KEEP_RATIO)) return null;
  return { existing, incoming };
};

// PUT /api/kv/:key
//   body { value }                  -> unconditional write (legacy callers)
//   body { value, version: string } -> only overwrites that exact version
//   body { value, version: null }   -> only creates a key that doesn't exist yet
//   body { ..., allowShrink: true } -> opts out of the mass-deletion guard
// 200 { success: true, version } on success, 409 { conflict: true, value, version } on a clash.
export const putKV = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const value = String(req.body?.value ?? '');
    const body = req.body ?? {};

    // One read serves both the guard and the history snapshot below.
    const existingRow = await prisma.kVStore.findUnique({ where: { key } });

    const destructive = wouldDestroyData(existingRow, value, body);
    if (destructive) {
      console.warn(
        `[kv] refused write to "${key}": would drop ${destructive.existing} entries to ${destructive.incoming}`
      );
      res.status(409).json({
        success: false,
        conflict: true,
        refused: 'mass-deletion',
        ...destructive,
        ...(await currentOf(key)),
      });
      return;
    }

    // Keep the outgoing value, but only once the write has actually landed and
    // only when something changed - re-saving an identical blob is not history.
    const snapshotPrevious = async (): Promise<void> => {
      if (existingRow && existingRow.value !== value) {
        await recordRevision(key, existingRow.value);
      }
    };

    if (!('version' in body)) {
      await prisma.kVStore.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      await snapshotPrevious();
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
    await snapshotPrevious();
    res.json({ success: true, version: versionOf(value) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /api/kv/:key  ->  { success: true }
export const deleteKV = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const existing = await prisma.kVStore.findUnique({ where: { key } });
    if (existing) await recordRevision(key, existing.value);
    await prisma.kVStore.deleteMany({ where: { key } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/kv/:key/revisions -> { revisions: [{ id, createdAt, entries }] }
// Values are omitted: the list exists to pick from, and each one is a full copy
// of the quarter, so returning them all would be a multi-megabyte response.
export const listRevisions = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureRevisionTable();
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const revisions = await prisma.kVRevision.findMany({
      where: { key },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, entries: true },
    });
    const current = await prisma.kVStore.findUnique({ where: { key } });
    res.json({
      key,
      current: current ? { entries: entryCount(current.value), updatedAt: current.updatedAt } : null,
      revisions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/kv/:key/revisions/:id -> { id, createdAt, entries, value }
export const getRevision = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureRevisionTable();
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'bad revision id' });
      return;
    }
    const revision = await prisma.kVRevision.findFirst({ where: { id, key } });
    if (!revision) {
      res.status(404).json({ success: false, error: 'no such revision for this key' });
      return;
    }
    res.json(revision);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/kv/:key/revisions/:id/restore  body { pin }  ->  { success, version, entries }
 *
 * Requires the edit PIN. Restoring is the one operation here that deliberately
 * overwrites current data with older data, so it bypasses the mass-deletion
 * guard - which means it must not be callable by anyone who finds the URL.
 *
 * The state being replaced is itself snapshotted first, so restoring to the
 * wrong point is undoable rather than a second loss.
 */
export const restoreRevision = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureRevisionTable();
    const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
    if (!safeEqual(pin, env.EDIT_PIN)) {
      res.status(403).json({ success: false, error: 'wrong or missing edit PIN' });
      return;
    }

    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'bad revision id' });
      return;
    }

    const revision = await prisma.kVRevision.findFirst({ where: { id, key } });
    if (!revision) {
      res.status(404).json({ success: false, error: 'no such revision for this key' });
      return;
    }

    const existing = await prisma.kVStore.findUnique({ where: { key } });
    if (existing && existing.value !== revision.value) {
      await recordRevision(key, existing.value);
    }

    await prisma.kVStore.upsert({
      where: { key },
      update: { value: revision.value },
      create: { key, value: revision.value },
    });

    console.warn(
      `[kv] restored "${key}" to revision ${id} from ${revision.createdAt.toISOString()} ` +
        `(${entryCount(existing?.value ?? '') ?? '?'} -> ${revision.entries ?? '?'} entries)`
    );

    res.json({
      success: true,
      version: versionOf(revision.value),
      entries: revision.entries,
      restoredFrom: revision.createdAt,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
