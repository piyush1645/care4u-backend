/**
 * common/helpers/WrapAsync.ts — Async Error Wrapper
 *
 * Wraps async controller functions so you don't need try/catch in every handler.
 * Errors are automatically forwarded to Express's error middleware.
 *
 * Usage in controller:
 *   getUsers = WrapAsync(async (req, res) => {
 *     const users = await this.userService.findAll();
 *     generalResponse({ req, res, data: users });
 *   });
 */

import { type Request, type Response, type NextFunction } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const WrapAsync = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};
