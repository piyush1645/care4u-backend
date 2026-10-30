import { google } from "googleapis";
import { DatabaseError } from "../../../common/handlers/error.handlers.js";
import { oauth2Client } from "../../../common/helpers/google/oauth.helper.js";
import prisma from "../../../config/prisma.js";
import type { ICreateCalendarConnection, ICreateEvent } from "../interface/google.interface.js";

export const createCalendarConnection = async (data: ICreateCalendarConnection) => {
    try {
        const createdConnection = await prisma.calendarConnection.create({
            data: {
                calendarId: data.calendarId,
                email: data.email,
                refreshToken: data.refreshToken,
                status: "CONNECTED",
                doctorId: data.doctorId,
            }
        });
        return createdConnection
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating connection');
    }
}

export const findByEmail = async (email: string) => {
    try {
        const connection = await prisma.calendarConnection.findUnique({
            where: {
                email
            }
        });
        return connection;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while fetching data');
    }
}

export const findByDoctorId = async (doctorId: bigint) => {
    try {
        const connection = await prisma.calendarConnection.findUnique({
            where: {
                doctorId
            }
        });
        return connection;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while fetching data');
    }
}

export const createEvent = async (data: ICreateEvent) => {
    try {
        oauth2Client.setCredentials({
            refresh_token: data.refreshToken
        });

        const calendar = google.calendar({
            version: 'v3',
            auth: oauth2Client
        });

        const event = await calendar.events.insert({
            calendarId: data.calendarId,
            requestBody: {
                summary: `Appointment with ${data.patientName}`,
                description: `Appointment Reference ID: ${data.appointmentReferenceNumber}`,

                start: {
                    dateTime: data.startTime.toISOString(),
                    timeZone: "Asia/Kolkata"
                },

                end: {
                    dateTime: data.endTime.toISOString(),
                    timeZone: "Asia/Kolkata"
                },
            },
        })
        return event;
    } catch (error) {
        console.error(error);
    }
}

export const findCalendarConnectionByDoctorId = async (doctorId: bigint) => {
    try {
        const calendarConnection = await prisma.calendarConnection.findUnique({
            where: {
                doctorId
            }
        });
        return calendarConnection;
    } catch (error) {
        console.error(error);
    }
}