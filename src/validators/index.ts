import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(4, 'Password must be at least 4 characters long'),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    password: z.string().min(4, 'Password must be at least 4 characters long'),
    role: z.enum(['ADMIN', 'VIEWER']).default('VIEWER'),
    workspaceId: z.string().optional(),
  }),
});

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Campaign name must be at least 3 characters'),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
    countryId: z.string().optional(),
    stageId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const updateCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
    countryId: z.string().optional(),
    stageId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const createDashboardMessageSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().min(5, 'Content must be at least 5 characters'),
    type: z.enum(['ANNOUNCEMENT', 'ALERT', 'UPDATE', 'MAINTENANCE']).default('ANNOUNCEMENT'),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  }),
});

export const updateMessageStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  }),
});

export const createCalendarEventSchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    status: z.string().default('SCHEDULED'),
  }),
});

export const createCopySchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
    title: z.string().min(3, 'Title is required'),
    content: z.string().min(5, 'Content is required'),
    channel: z.string().min(2, 'Channel is required'),
    status: z.string().default('DRAFT'),
  }),
});

export const createPerformanceSchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
    impressions: z.number().min(0),
    clicks: z.number().min(0),
    conversions: z.number().min(0),
    spend: z.number().min(0),
    revenue: z.number().min(0),
    date: z.string().optional(),
  }),
});
