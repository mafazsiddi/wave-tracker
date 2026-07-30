import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse, errorResponse } from '../utils/response';
import { CalendarEvent } from '../types';

export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  const { campaignId } = req.query;

  let filtered = [...mockStore.calendarEvents];

  if (campaignId) {
    filtered = filtered.filter((event) => event.campaignId === campaignId);
  }

  successResponse(res, filtered, 'Calendar events retrieved successfully');
};

export const createCalendarEvent = async (req: Request, res: Response): Promise<void> => {
  const { campaignId, title, description, startDate, endDate, status } = req.body;

  const campaign = mockStore.campaigns.find((c) => c.id === campaignId);

  const newEvent: CalendarEvent = {
    id: `cal-${Date.now()}`,
    campaignId,
    campaignName: campaign ? campaign.name : 'ClearTax Marketing Campaign',
    title,
    description: description || '',
    startDate,
    endDate,
    status: status || 'SCHEDULED',
    createdBy: req.user?.email || 'admin@cleartax.in',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStore.calendarEvents.unshift(newEvent);
  successResponse(res, newEvent, 'Calendar event created successfully', 201);
};

export const updateCalendarEvent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.calendarEvents.findIndex((e) => e.id === id);

  if (index === -1) {
    errorResponse(res, `Calendar event with ID ${id} not found`, 404);
    return;
  }

  const updatedEvent = {
    ...mockStore.calendarEvents[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  mockStore.calendarEvents[index] = updatedEvent;
  successResponse(res, updatedEvent, 'Calendar event updated successfully');
};

export const deleteCalendarEvent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.calendarEvents.findIndex((e) => e.id === id);

  if (index === -1) {
    errorResponse(res, `Calendar event with ID ${id} not found`, 404);
    return;
  }

  mockStore.calendarEvents.splice(index, 1);
  successResponse(res, null, 'Calendar event deleted successfully');
};
