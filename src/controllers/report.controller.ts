import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse } from '../utils/response';
import { Report } from '../types';

export const getReports = async (_req: Request, res: Response): Promise<void> => {
  const totalSpend = mockStore.performanceMetrics.reduce((acc, p) => acc + p.spend, 0);
  const totalRevenue = mockStore.performanceMetrics.reduce((acc, p) => acc + p.revenue, 0);
  const totalConversions = mockStore.performanceMetrics.reduce((acc, p) => acc + p.conversions, 0);
  const avgROI = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;

  const reports: Report[] = [
    {
      id: 'rep-q3-2026',
      title: 'Q3 Marketing Performance & ROI Report',
      period: '2026-07-01 to 2026-09-30',
      metrics: {
        totalCampaigns: mockStore.campaigns.length,
        activeCampaigns: mockStore.campaigns.filter((c) => c.status === 'ACTIVE').length,
        totalSpend,
        totalRevenue,
        totalConversions,
        avgROI,
      },
      generatedAt: new Date().toISOString(),
    },
    {
      id: 'rep-global-mandate',
      title: 'ClearTax E-Invoicing Global Mandate Performance Summary',
      period: '2026-06-01 to 2026-08-31',
      metrics: {
        totalCampaigns: 1,
        activeCampaigns: 1,
        totalSpend: 12500,
        totalRevenue: 68000,
        totalConversions: 1420,
        avgROI: 444,
      },
      generatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  successResponse(res, reports, 'Reports retrieved successfully');
};

export const exportReports = async (req: Request, res: Response): Promise<void> => {
  const format = (req.query.format as string) || 'csv';

  if (format === 'csv') {
    const csvHeader = 'CampaignID,CampaignName,Impressions,Clicks,Conversions,Spend,Revenue,Date\n';
    const csvRows = mockStore.performanceMetrics
      .map(
        (p) =>
          `"${p.campaignId}","${p.campaignName || ''}",${p.impressions},${p.clicks},${p.conversions},${p.spend},${p.revenue},"${p.date}"`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="marketing_report.csv"');
    res.status(200).send(csvHeader + csvRows);
    return;
  }

  successResponse(
    res,
    {
      exportUrl: '/api/reports/export?format=csv',
      data: mockStore.performanceMetrics,
    },
    'Report exported successfully'
  );
};
