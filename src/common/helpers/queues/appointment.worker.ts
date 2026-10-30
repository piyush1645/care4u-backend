import { Worker } from "bullmq";
import redis from "../redis.helper.js";

export const appointmentWorker = new Worker(
    "appointment-reminders",
    async (job) => {
        const { reminderType } = job.data;
        console.log("Appointment ID:", BigInt(job.data.appointmentId));
        console.log("Reminder Type:", reminderType);

        // add logic to send mail
    }, 
    {
        connection: redis as any
    }
)