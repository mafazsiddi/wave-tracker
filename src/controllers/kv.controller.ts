import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Key-value store backing the Wave Tracker frontend's window.storage.
 * Keys are arbitrary strings (e.g. "meta", "qdata:JAS'26", "comments:JAS'26")
 * and values are JSON strings. Shared across the whole team.
 */

// GET /api/kv/:key  ->  { value: string | null }
export const getKV = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const row = await prisma.kVStore.findUnique({ where: { key } });
    res.json({ value: row ? row.value : null });
  } catch (error: any) {
    res.status(500).json({ value: null, error: error.message });
  }
};

// PUT /api/kv/:key  body { value }  ->  { success: true }
export const putKV = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const value = String(req.body?.value ?? '');
    await prisma.kVStore.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    res.json({ success: true });
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
