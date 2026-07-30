import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse, errorResponse } from '../utils/response';
import { Campaign } from '../types';

export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  const { status, countryId, stageId } = req.query;

  let filtered = [...mockStore.campaigns];

  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (countryId) {
    filtered = filtered.filter((c) => c.countryId === countryId);
  }
  if (stageId) {
    filtered = filtered.filter((c) => c.stageId === stageId);
  }

  successResponse(res, filtered, 'Campaigns retrieved successfully');
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const campaign = mockStore.campaigns.find((c) => c.id === id);

  if (!campaign) {
    errorResponse(res, `Campaign with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, campaign, 'Campaign retrieved successfully');
};

export const createCampaign = async (req: Request, res: Response): Promise<void> => {
  const { name, description, status, countryId, stageId, startDate, endDate } = req.body;

  const country = mockStore.countries.find((c) => c.id === countryId);
  const stage = mockStore.stages.find((s) => s.id === stageId);

  const newCampaign: Campaign = {
    id: `cmp-${Date.now()}`,
    name,
    description: description || '',
    status: status || 'DRAFT',
    countryId: countryId || 'cnt-in',
    countryName: country ? country.name : 'India',
    stageId: stageId || 'stg-1',
    stageName: stage ? stage.name : 'Planning & Strategy',
    workspaceId: 'ws-b2b-marketing',
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 86400000 * 30).toISOString(),
    createdBy: req.user?.email || 'admin@cleartax.in',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStore.campaigns.unshift(newCampaign);
  successResponse(res, newCampaign, 'Campaign created successfully', 201);
};

export const updateCampaign = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.campaigns.findIndex((c) => c.id === id);

  if (index === -1) {
    errorResponse(res, `Campaign with ID ${id} not found`, 404);
    return;
  }

  const updatedCampaign = {
    ...mockStore.campaigns[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  if (req.body.countryId) {
    const country = mockStore.countries.find((c) => c.id === req.body.countryId);
    if (country) updatedCampaign.countryName = country.name;
  }

  if (req.body.stageId) {
    const stage = mockStore.stages.find((s) => s.id === req.body.stageId);
    if (stage) updatedCampaign.stageName = stage.name;
  }

  mockStore.campaigns[index] = updatedCampaign;
  successResponse(res, updatedCampaign, 'Campaign updated successfully');
};

export const deleteCampaign = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.campaigns.findIndex((c) => c.id === id);

  if (index === -1) {
    errorResponse(res, `Campaign with ID ${id} not found`, 404);
    return;
  }

  mockStore.campaigns.splice(index, 1);
  successResponse(res, null, 'Campaign deleted successfully');
};
