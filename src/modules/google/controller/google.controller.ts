import { google } from "googleapis";
import { BadRequestError, InternalServerError, ResourceAlreadyExistError, UnauthorizedError } from "../../../common/handlers/error.handlers.js";
import type { IResponse } from "../../../common/handlers/response.handler.js";
import { oauth2Client } from "../../../common/helpers/google/oauth.helper.js"
import type { Request, Response } from "express";
import * as googleService from '../service/google.service.js'


export const connectGoogleCalender = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const doctorId = req.user?.userId;
        if(!doctorId) {
            throw new UnauthorizedError('Invalid user');
        }
        const stringDoctorId = doctorId.toString()
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/calendar.events"
            ],
            state: JSON.stringify({
                stringDoctorId
            })
        })
        response = {
            message: 'Connection Initiated',
            status: 200,
            success: true,
            data: url
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}

export const googleCallback = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const { code, state } = req.query;
        if (!code || typeof code != 'string') {
            throw new BadRequestError('Invalid Callback');
        }

        if (!state || typeof state != 'string') {
            throw new BadRequestError('Invalid Callback');
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            version: "v2",
            auth: oauth2Client
        });

        const profile = await oauth2.userinfo.get();
        if(!profile.data.email || !tokens.refresh_token) {
            throw new InternalServerError('Error while connecting with calendar')
        }
        const doctorId = JSON.parse(state).doctorId

        const isEmailUsed = await googleService.findByEmail(profile.data.email);
        if(isEmailUsed) {
            throw new ResourceAlreadyExistError('This email is already connected with another account');
        }
        const isAlreadyConnected = await googleService.findByDoctorId(BigInt(doctorId));
        if(isAlreadyConnected) {
            throw new ResourceAlreadyExistError('Your account is already connected');
        }

        const data = {
            calendarId: "primary",
            doctorId,
            email: profile.data.email,
            refreshToken: tokens.refresh_token
        }

        await googleService.createCalendarConnection(data);
        
        return res.redirect(
            `${process.env.FRONTEND_URL}/doctor/dashboard`
        );
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}