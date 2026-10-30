import { Worker } from "bullmq";
import redis from "../redis.helper.js";
import { CreateMeetingSchema } from "../../validation/meeting.validation.js";
import * as meetingService from '../../../modules/meeting/service/meeting.service.js'
import * as zoomService from '../../../modules/zoom/service/zoom.service.js'

export const meetingWorker = new Worker(
    "meeting-link",
    async (job) => {
        
        const { appointmentId, doctorId, patientId, startTime, slotDuration } = job.data;
        console.log("Appointment ID:", BigInt((appointmentId)));
        console.log("Doctor ID: ", BigInt((doctorId)));
        console.log("Patient ID: ", BigInt((patientId)));
        console.log("start time: ", new Date(startTime));
        const link = await zoomService.createMeeting(
            'Medical Consultation',
            startTime,
            Number(slotDuration)
        );
        console.log("Meeting Link ", link);
        
        const data = {
            appointmentId: BigInt((appointmentId)),
            doctorId: BigInt((doctorId)),
            link: link.join_url,
            patientId: BigInt((patientId)),
            startTime: new Date(startTime),
            joinUrl: link.join_url,
            startUrl: link.start_url,
            password: link.password
        };
        const result = CreateMeetingSchema.safeParse(data);
        if(result.success) {
            try {                
                await meetingService.create(result.data);
                //send meeting link mail
            } catch (error) {
                console.error(error);
                console.error("Meeting link generation failed");
            }
        } else {
            console.error(result.error.flatten());
            return;
        }

    }, 
    {
        connection: redis as any
    }
)