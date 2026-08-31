/**
 * Projects the `qdata:<quarter>` blob into one Entry row per dashboard entry.
 *
 * This is the first half of moving off the single-blob model, and it is
 * deliberately inert: rows are written, nothing reads them, and KVStore stays
 * the source of truth. The point is to run the new shape alongside the old one
 * long enough to prove it reproduces the blob exactly, before anything depends
 * on it. Cutting over on the strength of a backfill that merely looked right is
 * how a migration turns into a second data-loss incident.
 *
 * Projection is applied as a delta against the blob's previous value, so a
 * normal save touches the one or two rows that actually changed rather than
 * rewriting all ~1,500 - which matters on a serverless function talking to a
 * database in another region.
 *
 * Nothing here may break the write it accompanies. A projection failure leaves
 * the real data untouched and correct; a projection failure that took the
 * dashboard down with it would be a worse outcome than not projecting at all.
 */
import prisma from '../config/database';

export const QDATA_PREFIX = 'qdata:';

/** "qdata:JAS'26" -> "JAS'26", or null for keys that aren't quarter data. */
export const quarterFromKey = (key: string): string | null =>
  key.startsWith(QDATA_PREFIX) ? key.slice(QDATA_PREFIX.length) : null;

interface RawEntry {
  id?: string;
  channel?: string;
  kind?: string;
  group?: string;
  country?: string;
  [k: string]: any;
}

/** Entries of a blob, or [] if it isn't one. Never throws - callers are on a write path. */
export const parseEntries = (value: string | null | undefined): RawEntry[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
};

/**
 * Create the table if it isn't there, once per process.
 *
 * Same reasoning as KVRevision: this project has no migrations directory, the
 * schema is applied by hand with `prisma db push`, and production has already
 * once been left without a table that existed locally. Strictly additive, so
 * it is safe to run against a shared database.
 */
let tableReady: Promise<void> | null = null;
export const ensureEntryTable = (): Promise<void> => {
  if (!tableReady) {
    tableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Entry" (
          "quarter"   TEXT NOT NULL,
          "id"        TEXT NOT NULL,
          "ord"       INTEGER NOT NULL DEFAULT 0,
          "channel"   TEXT,
          "kind"      TEXT,
          "group"     TEXT,
          "country"   TEXT,
          "data"      TEXT NOT NULL,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP(3),
          CONSTRAINT "Entry_pkey" PRIMARY KEY ("quarter", "id")
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "Entry_quarter_deletedAt_idx" ON "Entry"("quarter", "deletedAt")`
      );
    })().catch((error: any) => {
      // Let the next call retry rather than caching the failure for the life
      // of the process.
      tableReady = null;
      console.error(`[entry] could not ensure Entry table: ${error.message}`);
    });
  }
  return tableReady;
};

export interface ProjectionDelta {
  upserted: number;
  softDeleted: number;
  revived: number;
}

/**
 * Bring the Entry rows for `quarter` in line with `nextValue`, doing only the
 * work the change actually implies.
 *
 * `previousValue` is what the blob held a moment ago; comparing against it is
 * what keeps a one-row edit to a one-row write. Passing null forces a full
 * pass, which is what the backfill wants.
 */
export const projectQuarter = async (
  quarter: string,
  previousValue: string | null,
  nextValue: string
): Promise<ProjectionDelta> => {
  await ensureEntryTable();

  // Both the content and the position a row previously held, taken from the
  // blob itself. Reading them from the blob rather than from the database is
  // what lets the whole projection run without a single SELECT.
  const before = new Map<string, string>();
  const beforeOrd = new Map<string, number>();
  parseEntries(previousValue).forEach((e, i) => {
    if (e && e.id) {
      before.set(String(e.id), JSON.stringify(e));
      beforeOrd.set(String(e.id), i);
    }
  });

  const after = parseEntries(nextValue);
  const seen = new Set<string>();
  const changed: { entry: RawEntry; ord: number; json: string }[] = [];
  const movedOnly: { id: string; ord: number }[] = [];

  after.forEach((entry, ord) => {
    if (!entry || !entry.id) return;
    const id = String(entry.id);
    // A duplicate id would silently drop a row on upsert; keep the first, which
    // is what the blob's own id-keyed lookups already do.
    if (seen.has(id)) return;
    seen.add(id);
    const json = JSON.stringify(entry);
    if (before.get(id) !== json || previousValue === null) {
      changed.push({ entry, ord, json });
    } else if (beforeOrd.get(id) !== ord) {
      // Untouched, but everything after an insert or delete shifts up or down,
      // and the UI reads order from `ord`.
      movedOnly.push({ id, ord });
    }
  });

  // Written as batched multi-row statements rather than a query per row. A
  // one-row edit is a handful of queries either way, but a backfill or a large
  // sync is ~1,500, and a serverless function talking to a database in another
  // region does not survive that many round trips.
  const CHUNK = 250;
  let upserted = 0;
  for (let i = 0; i < changed.length; i += CHUNK) {
    const slice = changed.slice(i, i + CHUNK);
    const params: any[] = [];
    const tuples = slice.map(({ entry, ord, json }) => {
      const base = params.length;
      params.push(quarter, String(entry.id), ord, entry.channel ?? null, entry.kind ?? null,
        entry.group ?? null, entry.country ?? null, json);
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},NOW(),NULL)`;
    });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Entry" ("quarter","id","ord","channel","kind","group","country","data","updatedAt","deletedAt")
       VALUES ${tuples.join(',')}
       ON CONFLICT ("quarter","id") DO UPDATE SET
         "ord" = EXCLUDED."ord", "channel" = EXCLUDED."channel", "kind" = EXCLUDED."kind",
         "group" = EXCLUDED."group", "country" = EXCLUDED."country", "data" = EXCLUDED."data",
         "updatedAt" = NOW(), "deletedAt" = NULL`,
      ...params
    );
    upserted += slice.length;
  }

  for (let i = 0; i < movedOnly.length; i += CHUNK) {
    const slice = movedOnly.slice(i, i + CHUNK);
    const params: any[] = [quarter];
    const tuples = slice.map(({ id, ord }) => {
      const base = params.length;
      params.push(id, ord);
      return `($${base + 1},$${base + 2}::int)`;
    });
    await prisma.$executeRawUnsafe(
      `UPDATE "Entry" AS e SET "ord" = v.ord
       FROM (VALUES ${tuples.join(',')}) AS v(id, ord)
       WHERE e."quarter" = $1 AND e."id" = v.id`,
      ...params
    );
  }

  // Gone from the blob - soft delete, so it stays recoverable.
  const removed = [...before.keys()].filter((id) => !seen.has(id));
  let softDeleted = 0;
  if (removed.length) {
    const r: number = await prisma.$executeRaw`
      UPDATE "Entry" SET "deletedAt" = NOW()
      WHERE "quarter" = ${quarter} AND "deletedAt" IS NULL AND "id" = ANY(${removed})
    `;
    softDeleted = r;
  }

  // A full pass has to account for rows deleted earlier that the blob no longer
  // mentions at all; incremental passes see those as simply absent.
  let revived = 0;
  if (previousValue === null && seen.size) {
    const ids = [...seen];
    const r: number = await prisma.$executeRaw`
      UPDATE "Entry" SET "deletedAt" = NOW()
      WHERE "quarter" = ${quarter} AND "deletedAt" IS NULL AND NOT ("id" = ANY(${ids}))
    `;
    softDeleted += r;
  }

  return { upserted, softDeleted, revived };
};

/**
 * Rebuild the blob from rows. This is what the read path will eventually
 * serve; for now it exists so the two can be compared.
 */
export const assembleFromRows = async (quarter: string): Promise<RawEntry[]> => {
  await ensureEntryTable();
  const rows = await prisma.$queryRaw<{ data: string }[]>`
    SELECT "data" FROM "Entry"
    WHERE "quarter" = ${quarter} AND "deletedAt" IS NULL
    ORDER BY "ord" ASC
  `;
  return rows.map((r) => JSON.parse(r.data));
};

export interface ProjectionCheck {
  quarter: string;
  blobEntries: number;
  rowEntries: number;
  missingFromRows: string[];
  extraInRows: string[];
  contentMismatches: string[];
  orderMatches: boolean;
  identical: boolean;
}

/**
 * Compare the projected rows against the blob they came from.
 *
 * The gate on cutting the read path over: until this reports identical for a
 * quarter, that quarter's rows are not to be trusted as its source of truth.
 */
export const checkProjection = async (quarter: string): Promise<ProjectionCheck> => {
  const row = await prisma.kVStore.findUnique({ where: { key: QDATA_PREFIX + quarter } });
  const blob = parseEntries(row?.value ?? null).filter((e) => e && e.id);
  const rows = await assembleFromRows(quarter);

  const blobById = new Map(blob.map((e) => [String(e.id), JSON.stringify(e)]));
  const rowById = new Map(rows.map((e) => [String(e.id), JSON.stringify(e)]));

  const missingFromRows = [...blobById.keys()].filter((id) => !rowById.has(id));
  const extraInRows = [...rowById.keys()].filter((id) => !blobById.has(id));
  const contentMismatches = [...blobById.entries()]
    .filter(([id, json]) => rowById.has(id) && rowById.get(id) !== json)
    .map(([id]) => id);

  const blobOrder = blob.map((e) => String(e.id)).join(',');
  const rowOrder = rows.map((e) => String(e.id)).join(',');

  return {
    quarter,
    blobEntries: blob.length,
    rowEntries: rows.length,
    missingFromRows: missingFromRows.slice(0, 25),
    extraInRows: extraInRows.slice(0, 25),
    contentMismatches: contentMismatches.slice(0, 25),
    orderMatches: blobOrder === rowOrder,
    identical:
      !missingFromRows.length &&
      !extraInRows.length &&
      !contentMismatches.length &&
      blobOrder === rowOrder,
  };
};
