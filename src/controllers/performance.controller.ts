import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse, errorResponse } from '../utils/response';
import { PerformanceMetric } from '../types';

export const getPerformanceMetrics = async (_req: Request, res: Response): Promise<void> => {
  const metrics = mockStore.performanceMetrics.map((p) => {
    const ctr = p.impressions > 0 ? Number(((p.clicks / p.impressions) * 100).toFixed(2)) : 0;
    const roi = p.spend > 0 ? Number((((p.revenue - p.spend) / p.spend) * 100).toFixed(0)) : 0;
    return { ...p, ctr, roi };
  });

  successResponse(res, metrics, 'Performance metrics retrieved successfully');
};

export const getPerformanceByCampaignId = async (req: Request, res: Response): Promise<void> => {
  const campaignId = String(req.params.campaignId);
  const metrics = mockStore.performanceMetrics.filter((p) => p.campaignId === campaignId);

  if (metrics.length === 0) {
    const defaultMetric: PerformanceMetric = {
      id: `prf-${Date.now()}`,
      campaignId,
      campaignName: 'ClearTax Campaign',
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      ctr: 0,
      roi: 0,
      date: new Date().toISOString(),
    };
    successResponse(res, [defaultMetric], 'Performance metric retrieved (initialized default)');
    return;
  }

  successResponse(res, metrics, 'Campaign performance metrics retrieved successfully');
};

export const createPerformanceMetric = async (req: Request, res: Response): Promise<void> => {
  const { campaignId, impressions, clicks, conversions, spend, revenue, date } = req.body;

  const campaign = mockStore.campaigns.find((c) => c.id === campaignId);
  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
  const roi = spend > 0 ? Number((((revenue - spend) / spend) * 100).toFixed(0)) : 0;

  const newMetric: PerformanceMetric = {
    id: `prf-${Date.now()}`,
    campaignId,
    campaignName: campaign ? campaign.name : 'ClearTax Campaign',
    impressions,
    clicks,
    conversions,
    spend,
    revenue,
    ctr,
    roi,
    date: date || new Date().toISOString(),
  };

  mockStore.performanceMetrics.unshift(newMetric);
  successResponse(res, newMetric, 'Performance metric created successfully', 201);
};

export const updatePerformanceMetric = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const index = mockStore.performanceMetrics.findIndex((p) => p.id === id);

  if (index === -1) {
    errorResponse(res, `Performance metric with ID ${id} not found`, 404);
    return;
  }

  const existing = mockStore.performanceMetrics[index];
  const updated = {
    ...existing,
    ...req.body,
  };

  updated.ctr = updated.impressions > 0 ? Number(((updated.clicks / updated.impressions) * 100).toFixed(2)) : 0;
  updated.roi = updated.spend > 0 ? Number((((updated.revenue - updated.spend) / updated.spend) * 100).toFixed(0)) : 0;

  mockStore.performanceMetrics[index] = updated;
  successResponse(res, updated, 'Performance metric updated successfully');
};
