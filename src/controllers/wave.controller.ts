import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse, WaveTrackerEntry } from '../types';

/**
 * Get all Wave Tracker entries with optional filters
 */
export const getWaveEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quarter, kind, channel, group, country, search } = req.query;

    const where: any = {};

    if (quarter) where.quarter = String(quarter);
    if (kind) where.kind = String(kind);
    if (channel) where.channel = String(channel);
    if (group) where.group = String(group);
    if (country) where.country = String(country);

    if (search) {
      const searchStr = String(search).toLowerCase();
      where.OR = [
        { title: { contains: searchStr, mode: 'insensitive' } },
        { subjectLine: { contains: searchStr, mode: 'insensitive' } },
        { name: { contains: searchStr, mode: 'insensitive' } },
        { topic: { contains: searchStr, mode: 'insensitive' } },
        { copyText: { contains: searchStr, mode: 'insensitive' } },
        { notes: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    const entries = await prisma.waveEntry.findMany({
      where,
      include: {
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response: ApiResponse<WaveTrackerEntry[]> = {
      success: true,
      message: 'Wave entries retrieved successfully',
      data: entries as any,
    };
    res.json(response);
  } catch (error: any) {
    console.error('Error fetching wave entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wave entries',
      errors: [error.message],
    });
  }
};

/**
 * Get a single wave entry by ID
 */
export const getWaveEntryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entry = await prisma.waveEntry.findUnique({
      where: { id },
      include: { comments: true },
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Wave entry not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Wave entry retrieved successfully',
      data: entry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wave entry',
      errors: [error.message],
    });
  }
};

/**
 * Create a new wave entry
 */
export const createWaveEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const entryData = req.body;

    const newEntry = await prisma.waveEntry.create({
      data: entryData,
      include: { comments: true },
    });

    res.status(201).json({
      success: true,
      message: 'Wave entry created successfully',
      data: newEntry,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to create wave entry',
      errors: [error.message],
    });
  }
};

/**
 * Update an existing wave entry
 */
export const updateWaveEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entryData = req.body;

    const updatedEntry = await prisma.waveEntry.update({
      where: { id },
      data: entryData,
      include: { comments: true },
    });

    res.json({
      success: true,
      message: 'Wave entry updated successfully',
      data: updatedEntry,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to update wave entry',
      errors: [error.message],
    });
  }
};

/**
 * Delete a wave entry
 */
export const deleteWaveEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await prisma.waveEntry.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Wave entry deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete wave entry',
      errors: [error.message],
    });
  }
};

/**
 * Add a comment to a wave entry
 */
export const addWaveComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, text } = req.body;

    const comment = await prisma.waveComment.create({
      data: {
        entryId: id,
        name: name || 'Anonymous',
        text,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to add comment',
      errors: [error.message],
    });
  }
};

/**
 * Delete a comment
 */
export const deleteWaveComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const commentId = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;

    await prisma.waveComment.delete({
      where: { id: commentId },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete comment',
      errors: [error.message],
    });
  }
};

/**
 * Get Wave Tracker metadata (quarters, stageGroups, passcode)
 */
export const getWaveMeta = async (req: Request, res: Response): Promise<void> => {
  try {
    let meta = await prisma.waveMeta.findUnique({
      where: { id: 'default' },
    });

    if (!meta) {
      // Create default metadata if not found
      meta = await prisma.waveMeta.create({
        data: {
          id: 'default',
          quarters: ['JAS26'],
          stageGroups: {
            postwave: ['KSA', 'Malaysia', 'India', 'Poland', 'Belgium'],
            live: ['UAE', 'France', 'Germany'],
            attack: ['Philippines', 'Oman', 'UK', 'Qatar', 'Spain'],
            activate: ['Netherlands', 'Ireland'],
            watch: ['Singapore', 'US'],
            webinar: ['Global (All Countries)'],
            lifecycle: ['Worldwide'],
          },
          passcode: 'wave2026',
        },
      });
    }

    res.json({
      success: true,
      message: 'Wave metadata retrieved successfully',
      data: meta,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wave metadata',
      errors: [error.message],
    });
  }
};

/**
 * Update Wave Tracker metadata
 */
export const updateWaveMeta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quarters, stageGroups, passcode } = req.body;

    const meta = await prisma.waveMeta.upsert({
      where: { id: 'default' },
      update: {
        ...(quarters && { quarters }),
        ...(stageGroups && { stageGroups }),
        ...(passcode !== undefined && { passcode }),
      },
      create: {
        id: 'default',
        quarters: quarters || ['JAS26', 'OND26', 'JFM27', 'AMJ27'],
        stageGroups: stageGroups || {},
        passcode: passcode || 'wave2026',
      },
    });

    res.json({
      success: true,
      message: 'Wave metadata updated successfully',
      data: meta,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to update wave metadata',
      errors: [error.message],
    });
  }
};
