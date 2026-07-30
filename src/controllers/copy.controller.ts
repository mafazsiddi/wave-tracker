import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse, errorResponse } from '../utils/response';
import { Copy } from '../types';

export const getCopies = async (req: Request, res: Response): Promise<void> => {
  const { campaignId, channel } = req.query;

  let filtered = [...mockStore.copies];

  if (campaignId) {
    filtered = filtered.filter((c) => c.campaignId === campaignId);
  }
  if (channel) {
    filtered = filtered.filter((c) => c.channel.toLowerCase() === (channel as string).toLowerCase());
  }

  successResponse(res, filtered, 'Marketing copies retrieved successfully');
};

export const createCopy = async (req: Request, res: Response): Promise<void> => {
  const { campaignId, title, content, channel, status } = req.body;

  const campaign = mockStore.campaigns.find((c) => c.id === campaignId);

  const newCopy: Copy = {
    id: `cpy-${Date.now()}`,
    campaignId,
    campaignName: campaign ? campaign.name : 'ClearTax Campaign',
    title,
    content,
    channel,
    status: status || 'DRAFT',
    createdBy: req.user?.email || 'admin@cleartax.in',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStore.copies.unshift(newCopy);
  successResponse(res, newCopy, 'Marketing copy created successfully', 201);
};

export const updateCopy = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.copies.findIndex((c) => c.id === id);

  if (index === -1) {
    errorResponse(res, `Copy with ID ${id} not found`, 404);
    return;
  }

  const updatedCopy = {
    ...mockStore.copies[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  mockStore.copies[index] = updatedCopy;
  successResponse(res, updatedCopy, 'Marketing copy updated successfully');
};

export const deleteCopy = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.copies.findIndex((c) => c.id === id);

  if (index === -1) {
    errorResponse(res, `Copy with ID ${id} not found`, 404);
    return;
  }

  mockStore.copies.splice(index, 1);
  successResponse(res, null, 'Marketing copy deleted successfully');
};
