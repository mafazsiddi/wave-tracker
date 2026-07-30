import {
  User,
  Workspace,
  Campaign,
  DashboardMessage,
  CalendarEvent,
  Copy,
  PerformanceMetric,
  Report,
  Country,
  Stage
} from '../types';

export class MockStore {
  users: User[] = [
    {
      id: 'usr-admin-01',
      email: 'admin@cleartax.in',
      name: 'ClearTax Admin',
      role: 'ADMIN',
      workspaceId: 'ws-b2b-marketing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-viewer-01',
      email: 'viewer@cleartax.in',
      name: 'Marketing Analyst',
      role: 'VIEWER',
      workspaceId: 'ws-b2b-marketing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  workspaces: Workspace[] = [
    {
      id: 'ws-b2b-marketing',
      name: 'ClearTax B2B Marketing',
      slug: 'cleartax-b2b-marketing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  countries: Country[] = [
    { id: 'cnt-in', code: 'IN', name: 'India' },
    { id: 'cnt-de', code: 'DE', name: 'Germany' },
    { id: 'cnt-ae', code: 'AE', name: 'UAE' },
    { id: 'cnt-om', code: 'OM', name: 'Oman' },
    { id: 'cnt-ph', code: 'PH', name: 'Philippines' }
  ];

  stages: Stage[] = [
    { id: 'stg-1', name: 'Planning & Strategy', order: 1 },
    { id: 'stg-2', name: 'Copywriting & Creative Design', order: 2 },
    { id: 'stg-3', name: 'Review & Approval', order: 3 },
    { id: 'stg-4', name: 'Live Campaign Execution', order: 4 },
    { id: 'stg-5', name: 'Post-Campaign Analytics', order: 5 }
  ];

  campaigns: Campaign[] = [
    {
      id: 'cmp-001',
      name: 'ClearTax E-Invoicing Global Mandate 2026',
      description: 'Global campaign targetting B2B enterprises for E-Invoicing compliance in UAE & Germany.',
      status: 'ACTIVE',
      countryId: 'cnt-de',
      countryName: 'Germany',
      stageId: 'stg-4',
      stageName: 'Live Campaign Execution',
      workspaceId: 'ws-b2b-marketing',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-08-31T00:00:00.000Z',
      createdBy: 'admin@cleartax.in',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cmp-002',
      name: 'Oman Corporate Tax Compliance Launch',
      description: 'Lead generation and awareness landing pages for Oman corporate tax filing.',
      status: 'ACTIVE',
      countryId: 'cnt-om',
      countryName: 'Oman',
      stageId: 'stg-4',
      stageName: 'Live Campaign Execution',
      workspaceId: 'ws-b2b-marketing',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-09-30T00:00:00.000Z',
      createdBy: 'admin@cleartax.in',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cmp-003',
      name: 'Q3 Enterprise SaaS Webflow Promotion',
      description: 'Webflow hero redesign & dynamic form submissions for high-intent leads.',
      status: 'PLANNED',
      countryId: 'cnt-in',
      countryName: 'India',
      stageId: 'stg-2',
      stageName: 'Copywriting & Creative Design',
      workspaceId: 'ws-b2b-marketing',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-10-15T00:00:00.000Z',
      createdBy: 'admin@cleartax.in',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  dashboardMessages: DashboardMessage[] = [
    {
      id: 'msg-001',
      title: 'Salesforce & HubSpot Sync Maintenance Scheduled',
      content: 'Scheduled maintenance for integration sync engines on July 25th at 02:00 AM UTC.',
      type: 'MAINTENANCE',
      status: 'ACTIVE',
      priority: 'HIGH',
      createdBy: 'ClearTax Admin',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'msg-002',
      title: 'Q3 Marketing Goals & Lead Targets Released',
      content: 'The marketing team targets 4,500 qualified lead conversions for the Global Mandate campaign.',
      type: 'ANNOUNCEMENT',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      createdBy: 'ClearTax Admin',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  calendarEvents: CalendarEvent[] = [
    {
      id: 'cal-001',
      campaignId: 'cmp-001',
      campaignName: 'ClearTax E-Invoicing Global Mandate 2026',
      title: 'Germany Webinar Launch & HubSpot Form Blast',
      description: 'Email newsletter blast to 15,000 Germany tax controllers.',
      startDate: '2026-07-22T10:00:00.000Z',
      endDate: '2026-07-22T12:00:00.000Z',
      status: 'SCHEDULED',
      createdBy: 'admin@cleartax.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cal-002',
      campaignId: 'cmp-002',
      campaignName: 'Oman Corporate Tax Compliance Launch',
      title: 'Oman Organic Landing Page A/B Testing',
      description: 'Reviewing converted leads from organic Oman tax landing page forms.',
      startDate: '2026-07-25T09:00:00.000Z',
      endDate: '2026-07-25T17:00:00.000Z',
      status: 'IN_PROGRESS',
      createdBy: 'admin@cleartax.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  copies: Copy[] = [
    {
      id: 'cpy-001',
      campaignId: 'cmp-001',
      campaignName: 'ClearTax E-Invoicing Global Mandate 2026',
      title: 'Hero Headline: Modern E-Invoicing Compliance for Global Enterprise',
      content: 'Seamlessly automate e-invoicing compliance across Germany, UAE, and GCC with ClearTax Enterprise.',
      channel: 'Webflow Hero Banner',
      status: 'APPROVED',
      createdBy: 'admin@cleartax.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cpy-002',
      campaignId: 'cmp-002',
      campaignName: 'Oman Corporate Tax Compliance Launch',
      title: 'HubSpot Form CTA Copy: Claim Your Free Tax Assessment',
      content: 'Get in touch with our tax experts to audit your business readiness for Oman corporate tax compliance.',
      channel: 'HubSpot Lead Form',
      status: 'IN_REVIEW',
      createdBy: 'admin@cleartax.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  performanceMetrics: PerformanceMetric[] = [
    {
      id: 'prf-001',
      campaignId: 'cmp-001',
      campaignName: 'ClearTax E-Invoicing Global Mandate 2026',
      impressions: 245000,
      clicks: 18400,
      conversions: 1420,
      spend: 12500,
      revenue: 68000,
      ctr: 7.51,
      roi: 444,
      date: '2026-07-19T00:00:00.000Z'
    },
    {
      id: 'prf-002',
      campaignId: 'cmp-002',
      campaignName: 'Oman Corporate Tax Compliance Launch',
      impressions: 112000,
      clicks: 9800,
      conversions: 890,
      spend: 6400,
      revenue: 31000,
      ctr: 8.75,
      roi: 384,
      date: '2026-07-19T00:00:00.000Z'
    }
  ];

  salesforceStatus = {
    connected: true,
    lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'IDLE',
    syncedRecords: 1450,
    environment: 'Production'
  };

  hubspotStatus = {
    connected: true,
    lastSyncedAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'IDLE',
    syncedForms: 42,
    syncedSubmissions: 3120,
    environment: 'Production'
  };
}

export const mockStore = new MockStore();
