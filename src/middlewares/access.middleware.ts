import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../common/handlers/error.handlers.js';

export const checkPermission = (permissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {  
            const permission = req.user?.role;
            if(!permission) {
                throw new UnauthorizedError('Access Denied');
            }
            const hasPermission = permissions.includes(permission);
            if (!hasPermission) {
                return res.status(403).json({
                    message: 'Permission denied',
                });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};