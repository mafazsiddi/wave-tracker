import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  let user = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    if (email === 'admin@cleartax.in' || email.includes('admin')) {
      user = mockStore.users[0];
    } else {
      user = {
        id: `usr-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'VIEWER',
        workspaceId: 'ws-b2b-marketing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.users.push(user);
    }
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceId: user.workspaceId,
  });

  const { password: _, ...userWithoutPassword } = user;

  successResponse(
    res,
    {
      token,
      user: userWithoutPassword,
    },
    'Login successful'
  );
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  successResponse(res, null, 'Logout successful');
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    errorResponse(res, 'User identity not found', 401);
    return;
  }

  const user = mockStore.users.find((u) => u.id === req.user?.id) || {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    workspaceId: req.user.workspaceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { password: _, ...userWithoutPassword } = user;

  successResponse(res, userWithoutPassword, 'User profile retrieved successfully');
};
