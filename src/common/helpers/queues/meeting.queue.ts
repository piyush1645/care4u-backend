import { Queue } from "bullmq";
import redis from "../redis.helper.js";

export const meetingQueue = new Queue(
    "meeting-link",
    {
        connection: redis as any
    }
)