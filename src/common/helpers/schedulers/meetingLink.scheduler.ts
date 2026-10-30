import { meetingQueue } from "../queues/meeting.queue.js";

export const scheduleMeetingLinkSender = async (
    appointmentId: bigint,
    doctorId: bigint,
    patientId: bigint,
    startTime: Date,
    reminderTime: Date,
    slotDuration: number
) => {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const reminder = reminderTime instanceof Date ? reminderTime : new Date(reminderTime);
    const delay = reminder.getTime() - Date.now();
    const isMeetingTimePassed = start.getTime() - Date.now()
    if (isMeetingTimePassed < 0) {  
        return;
    }
    console.log('hi');
    
    await meetingQueue.add(
        "meeting-link",
        {
            appointmentId: appointmentId.toString(),
            doctorId: doctorId.toString(),
            patientId: patientId.toString(),
            startTime: startTime.toString(),
            slotDuration: slotDuration.toString()
        },
        {
            delay,
            jobId: `meeting-${appointmentId.toString()}`,
        }
    )    
}

export const removeMeetingLinkSender = async (
    appointmentId: bigint,
) => {
    const jobId = `meeting-${appointmentId.toString()}`;

    const job = await meetingQueue.getJob(jobId);

    if (job) {
        await job.remove();
    }
};