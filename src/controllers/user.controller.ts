import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse, errorResponse } from '../utils/response';
import { User } from '../types';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  const safeUsers = mockStore.users.map(({ password, ...rest }) => rest);
  successResponse(res, safeUsers, 'Users retrieved successfully');
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = mockStore.users.find((u) => u.id === id);

  if (!user) {
    errorResponse(res, `User with ID ${id} not found`, 404);
    return;
  }

  const { password, ...safeUser } = user;
  successResponse(res, safeUser, 'User retrieved successfully');
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, name, role, workspaceId } = req.body;

  const existing = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    errorResponse(res, 'User with this email already exists', 400);
    return;
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    email,
    name,
    role: role || 'VIEWER',
    workspaceId: workspaceId || 'ws-b2b-marketing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStore.users.push(newUser);
  successResponse(res, newUser, 'User created successfully', 201);
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.users.findIndex((u) => u.id === id);

  if (index === -1) {
    errorResponse(res, `User with ID ${id} not found`, 404);
    return;
  }

  const updatedUser = {
    ...mockStore.users[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  mockStore.users[index] = updatedUser;

  const { password, ...safeUser } = updatedUser;
  successResponse(res, safeUser, 'User updated successfully');
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = mockStore.users.findIndex((u) => u.id === id);

  if (index === -1) {
    errorResponse(res, `User with ID ${id} not found`, 404);
    return;
  }

  mockStore.users.splice(index, 1);
  successResponse(res, null, 'User deleted successfully');
};
