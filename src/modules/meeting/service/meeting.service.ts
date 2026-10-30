import { DatabaseError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js";
import type { IMeeting } from "../interface/meeting.interface.js";

export const create = async (data: IMeeting) => {
    try {
        const createdMeeting = await prisma.meeting.create({
            data: {
                link: data.link,
                startTime: data.startTime,
                appointmentId: data.appointmentId,
                doctorId: data.doctorId,
                patientId: data.patientId,
                joinUrl: data.joinUrl,
                password: data.password,
                startUrl: data.startUrl
            }
        });
        return createdMeeting;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating meeting');
    }
}

export const findByAppointmentId = async (appointmentId: bigint) => {
    try {
        const meeting = await prisma.meeting.findUnique({
            where: {
                appointmentId
            }
        });
        return meeting;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating meeting');
    }
}

export const findByMeetingLink = async (link: string) => {
    try {
        const meeting = await prisma.meeting.findUnique({
            where: {
                link
            }
        });
        return meeting;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while finding meeting');
    }
}