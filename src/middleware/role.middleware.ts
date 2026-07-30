import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';
import { errorResponse } from '../utils/response';

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Unauthorized access', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      errorResponse(
        res,
        `Forbidden: Role '${req.user.role}' does not have permission to access this resource`,
        403
      );
      return;
    }

    next();
  };
};
