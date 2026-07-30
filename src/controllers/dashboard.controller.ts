import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse } from '../utils/response';
import { DashboardSummary } from '../types';

export const getDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
  const activeCampaigns = mockStore.campaigns.filter((c) => c.status === 'ACTIVE');
  const totalSpend = mockStore.performanceMetrics.reduce((acc, p) => acc + p.spend, 0);
  const totalRevenue = mockStore.performanceMetrics.reduce((acc, p) => acc + p.revenue, 0);
  const impressions = mockStore.performanceMetrics.reduce((acc, p) => acc + p.impressions, 0);
  const clicks = mockStore.performanceMetrics.reduce((acc, p) => acc + p.clicks, 0);
  const conversions = mockStore.performanceMetrics.reduce((acc, p) => acc + p.conversions, 0);
  const roi = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;

  const summary: DashboardSummary = {
    totalCampaigns: mockStore.campaigns.length,
    activeCampaigns: activeCampaigns.length,
    totalSpend,
    totalRevenue,
    roi,
    impressions,
    clicks,
    conversions,
    recentAnnouncements: mockStore.dashboardMessages.filter((m) => m.status === 'ACTIVE').slice(0, 5),
    activeCampaignsList: activeCampaigns,
  };

  successResponse(res, summary, 'Dashboard summary metrics retrieved successfully');
};
