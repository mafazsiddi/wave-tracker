import { Response } from 'express';
import { ApiResponse } from '../types';

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message = 'An error occurred',
  statusCode = 400,
  errors: any[] = []
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  };
  return res.status(statusCode).json(response);
};
