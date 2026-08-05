// Shared API response envelope used by the error handler and response helpers.
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}
