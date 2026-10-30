import { Queue } from "bullmq";
import redis from "../redis.helper.js";

export const appointmentQueue = new Queue(
    "appointment-reminders",
    {
        connection: redis as any
    }
)