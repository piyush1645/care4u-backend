import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../common/handlers/error.handlers.js";
import { verifyToken } from "../common/helpers/jwt.helper.js";
import type { IResponse } from "../common/handlers/response.handler.js";

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        const token = header?.split(' ')[1];

        if(!token) {
            throw new UnauthorizedError('Invalid request');
        }
        const user = verifyToken(token);
        if(!user) {
            throw new UnauthorizedError('Authentication Failed');
        }
        const userPayload = {
            email: user.email,
            userId: user.userId,
            role: user.role
        }
        req.user = userPayload;
        next();
    } catch (error: any) {
        console.log(error);
        const response: IResponse = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        }
        res.status(response.status).json(response);
    }
}