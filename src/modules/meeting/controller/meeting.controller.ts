import type { Request, Response } from "express"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../../common/handlers/error.handlers.js";
import { ROLE } from "../../../common/constants/index.js";
import type { IResponse } from "../../../common/handlers/response.handler.js";
import prisma from '../../../config/prisma.js';
import * as zoomService from '../../zoom/service/zoom.service.js';

export const getByAppointmentId = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const appointmentId = req.params.id;
        if(!appointmentId || Array.isArray(appointmentId)) {
            throw new BadRequestError('Invalid appointment id');
        }
        const userId = req.user?.userId;
        const role = req.user?.role;
        if(!userId || !role) {
            throw new UnauthorizedError('You are unauthorized to access this link');
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: BigInt(Number(appointmentId)) },
            include: { meeting: true }
        });
        
        if (!appointment) {
            throw new NotFoundError('Appointment not found');
        }

        if (role == ROLE.DOCTOR) {
            if (appointment.doctorId != userId) {
                throw new UnauthorizedError('You are unauthorized to access this link');
            }
        } else if (role == ROLE.PATIENT) {
            if (appointment.patientId != userId) {
                throw new UnauthorizedError('You are unauthorized to access this link');
            }
        }

        if (appointment.type !== 'ONLINE') {
            throw new BadRequestError('This is not an online appointment');
        }

        const now = new Date();
        const startTime = new Date(appointment.appointmentStartTime);
        const diffMinutes = (startTime.getTime() - now.getTime()) / 60000;

        if (role == ROLE.PATIENT && diffMinutes > 5) {
            throw new BadRequestError('Meeting link will be available 5 minutes before the scheduled time');
        }

        if (role == ROLE.DOCTOR && diffMinutes > 0) {
            throw new BadRequestError('You can only start/join the call at the scheduled time');
        }

        let meeting = appointment.meeting;
        if (!meeting) {
            // Generate Zoom meeting using zoomService on-the-fly
            const startTimeStr = new Date(appointment.appointmentStartTime).toISOString();
            const zoomLink = await zoomService.createMeeting(
                'Medical Consultation',
                startTimeStr,
                30
            );
            
            meeting = await prisma.meeting.create({
                data: {
                    appointmentId: appointment.id,
                    doctorId: appointment.doctorId,
                    patientId: appointment.patientId,
                    startTime: appointment.appointmentStartTime,
                    link: zoomLink.join_url,
                    joinUrl: zoomLink.join_url,
                    startUrl: zoomLink.start_url,
                    password: zoomLink.password || "",
                    status: 'IN_PROGRESS'
                }
            });
        }

        response = {
            message: 'Meeting link found',
            status: 200,
            success: true,
            data: role == ROLE.DOCTOR ? meeting.startUrl : meeting.link
        };
        res.status(200).json(response);
    } catch (error: any) {
        if (!error.statusCode || error.statusCode >= 500) {
            console.log(error);
        }
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error,
        };
        res.status(response.status).json(response);
    }
}

export const startMeeting = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const appointmentId = req.params.id;
        if(!appointmentId) {
            throw new BadRequestError('Invalid appointment id');
        }
        
        // Fetch the appointment
        const appointment = await prisma.appointment.findUnique({
            where: { id: BigInt(Number(appointmentId)) },
            include: { meeting: true }
        });
        
        if (!appointment) {
            throw new NotFoundError('Appointment not found');
        }

        // Check if the appointment start time has passed or is now
        const now = new Date();
        const startTime = new Date(appointment.appointmentStartTime);
        if (now.getTime() < startTime.getTime()) {
            throw new BadRequestError('You can only start the video call at the scheduled time');
        }
        
        let meeting = appointment.meeting;
        
        if (!meeting) {
            // Generate Zoom meeting using zoomService
            const startTimeStr = new Date(appointment.appointmentStartTime).toISOString();
            const zoomLink = await zoomService.createMeeting(
                'Medical Consultation',
                startTimeStr,
                30
            );
            
            // Create meeting in database
            meeting = await prisma.meeting.create({
                data: {
                    appointmentId: appointment.id,
                    doctorId: appointment.doctorId,
                    patientId: appointment.patientId,
                    startTime: appointment.appointmentStartTime,
                    link: zoomLink.join_url,
                    joinUrl: zoomLink.join_url,
                    startUrl: zoomLink.start_url,
                    password: zoomLink.password || "",
                    status: 'IN_PROGRESS'
                }
            });
        } else {
            // If meeting already exists, update its status to IN_PROGRESS
            meeting = await prisma.meeting.update({
                where: { id: meeting.id },
                data: { status: 'IN_PROGRESS' }
            });
        }
        
        response = {
            message: 'Meeting started successfully',
            status: 200,
            success: true,
            data: {
                ...meeting,
                id: meeting.id.toString(),
                appointmentId: meeting.appointmentId.toString(),
                doctorId: meeting.doctorId.toString(),
                patientId: meeting.patientId.toString()
            }
        };
        res.status(200).json(response);
    } catch (error: any) {
        console.error("Error starting meeting:", error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        };
        res.status(response.status).json(response);
    }
};

export const endMeeting = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const appointmentId = req.params.id;
        if(!appointmentId) {
            throw new BadRequestError('Invalid appointment id');
        }
        
        // Find the meeting
        const meeting = await prisma.meeting.findUnique({
            where: { appointmentId: BigInt(Number(appointmentId)) }
        });
        
        if (!meeting) {
            throw new NotFoundError('Meeting not found');
        }
        
        const updatedMeeting = await prisma.meeting.update({
            where: { id: meeting.id },
            data: { status: 'COMPLETED' }
        });
        
        response = {
            message: 'Meeting ended successfully',
            status: 200,
            success: true,
            data: {
                ...updatedMeeting,
                id: updatedMeeting.id.toString(),
                appointmentId: updatedMeeting.appointmentId.toString(),
                doctorId: updatedMeeting.doctorId.toString(),
                patientId: updatedMeeting.patientId.toString()
            }
        };
        res.status(200).json(response);
    } catch (error: any) {
        console.error("Error ending meeting:", error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        };
        res.status(response.status).json(response);
    }
};

