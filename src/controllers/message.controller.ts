import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse, errorResponse } from '../utils/response';
import { DashboardMessage } from '../types';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const { status, type, priority } = req.query;

  let filtered = [...mockStore.dashboardMessages];

  if (status) {
    filtered = filtered.filter((m) => m.status === status);
  }
  if (type) {
    filtered = filtered.filter((m) => m.type === type);
  }
  if (priority) {
    filtered = filtered.filter((m) => m.priority === priority);
  }

  successResponse(res, filtered, 'Dashboard messages retrieved successfully');
};

export const getMessageById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const message = mockStore.dashboardMessages.find((m) => m.id === id);

  if (!message) {
    errorResponse(res, `Dashboard message with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, message, 'Dashboard message retrieved successfully');
};

export const createMessage = async (req: Request, res: Response): Promise<void> => {
  const { title, content, type, status, priority } = req.body;

  const newMessage: DashboardMessage = {
    id: `msg-${Date.now()}`,
    title,
    content,
    type: type || 'ANNOUNCEMENT',
    status: status || 'ACTIVE',
    priority: priority || 'MEDIUM',
    createdBy: req.user?.name || 'ClearTax Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStore.dashboardMessages.unshift(newMessage);
  successResponse(res, newMessage, 'Dashboard message created successfully', 201);
};

export const updateMessage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.dashboardMessages.findIndex((m) => m.id === id);

  if (index === -1) {
    errorResponse(res, `Dashboard message with ID ${id} not found`, 404);
    return;
  }

  const updatedMessage = {
    ...mockStore.dashboardMessages[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  mockStore.dashboardMessages[index] = updatedMessage;
  successResponse(res, updatedMessage, 'Dashboard message updated successfully');
};

export const updateMessageStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const index = mockStore.dashboardMessages.findIndex((m) => m.id === id);

  if (index === -1) {
    errorResponse(res, `Dashboard message with ID ${id} not found`, 404);
    return;
  }

  mockStore.dashboardMessages[index].status = status;
  mockStore.dashboardMessages[index].updatedAt = new Date().toISOString();

  successResponse(
    res,
    mockStore.dashboardMessages[index],
    `Dashboard message status updated to ${status}`
  );
};

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.dashboardMessages.findIndex((m) => m.id === id);

  if (index === -1) {
    errorResponse(res, `Dashboard message with ID ${id} not found`, 404);
    return;
  }

  mockStore.dashboardMessages.splice(index, 1);
  successResponse(res, null, 'Dashboard message deleted successfully');
};
