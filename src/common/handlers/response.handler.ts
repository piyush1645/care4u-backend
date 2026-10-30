export interface IResponse {
  success: boolean;
  status: number;
  message: string;
  data?: unknown;
  error?: unknown;
}
