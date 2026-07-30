export type Role = 'ADMIN' | 'VIEWER';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  workspaceId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: Role;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  countryId?: string;
  countryName?: string;
  stageId?: string;
  stageName?: string;
  workspaceId?: string;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  campaignId: string;
  campaignName?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMessage {
  id: string;
  title: string;
  content: string;
  type: 'ANNOUNCEMENT' | 'ALERT' | 'UPDATE' | 'MAINTENANCE';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceMetric {
  id: string;
  campaignId: string;
  campaignName?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr?: number;
  roi?: number;
  date: string;
}

export interface Copy {
  id: string;
  campaignId: string;
  campaignName?: string;
  title: string;
  content: string;
  channel: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalRevenue: number;
  roi: number;
  impressions: number;
  clicks: number;
  conversions: number;
  recentAnnouncements: DashboardMessage[];
  activeCampaignsList: Campaign[];
}

export interface Report {
  id: string;
  title: string;
  period: string;
  metrics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    avgROI: number;
  };
  generatedAt: string;
}

export interface WaveComment {
  id: string;
  entryId: string;
  name: string;
  text: string;
  createdAt: string;
}

export interface WaveMeta {
  id: string;
  quarters: string[];
  stageGroups: Record<string, string[]>;
  passcode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WaveTrackerEntry {
  id: string;
  quarter: string;
  channel: 'email' | 'social' | string;
  kind: 'performance' | 'calendar' | 'copies' | string;
  group: 'postwave' | 'live' | 'attack' | 'activate' | 'watch' | 'webinar' | 'lifecycle' | string;
  country: string;

  // Common metadata
  title?: string;
  name?: string;
  date?: string;
  status?: string;
  notes?: string;

  // Performance Email Fields
  subjectLine?: string;
  emailsSent?: number;
  emailsOpened?: number;
  emailsUnopened?: number;
  bounced?: number;
  softBounce?: number;
  hardBounce?: number;
  totalDelivered?: number;
  deliverabilityRate?: number;
  uniqueClicks?: number;
  openRate?: number;
  deliveryRate?: number;
  htmlOpenRate?: number;
  ctor?: number;
  optOuts?: number;
  attachedLink?: string;
  emailLink?: string;

  // Performance Social Fields
  day?: string;
  slot?: number;
  bucket?: string;
  contentType?: string;
  link?: string;
  impressions?: number;
  views?: number;
  clicks?: number;
  ctr?: number;
  likes?: number;
  commentsCount?: number;
  reposts?: number;
  engagementRate?: number;
  cta?: string;

  // Calendar Fields
  drip?: string;
  target?: string;
  emailNum?: string;
  purpose?: string;
  topic?: string;
  accounts?: string;
  contacts?: string;
  deploymentDate?: string;
  plannedDate?: string;
  owner?: string;

  // Copies Fields
  copyText?: string;
  bannerLink?: string;
  version?: string;

  // Relations
  comments?: WaveComment[];

  createdAt?: string;
  updatedAt?: string;
}

