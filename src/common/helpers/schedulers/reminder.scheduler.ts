import { appointmentQueue } from "../queues/appointment.queue.js";

export const scheduleAppointmentReminder = async (
    appointmentId: bigint,
    reminderType: "day-before" | "two-hour",
    reminderTime: Date
) => {
    const delay = reminderTime.getTime() - Date.now();
    await appointmentQueue.add(
        "appointment-reminder",
        {
            appointmentId: appointmentId.toString(),
            reminderType,
        },
        {
            delay,
            jobId: `${appointmentId.toString()}-${reminderType}`,
        }
    )
}

export const removeAppointmentReminder = async (
    appointmentId: bigint,
    reminderType: "day-before" | "two-hour"
) => {
    const jobId = `${appointmentId.toString()}-${reminderType}`;

    const job = await appointmentQueue.getJob(jobId);

    if (job) {
        await job.remove();
    }
};


export const getReminderTimes = (
  appointmentAt: Date
) => {
  const dayBeforeReminder = new Date(appointmentAt);

  dayBeforeReminder.setDate(
    dayBeforeReminder.getDate() - 1
  );
  dayBeforeReminder.setHours(9, 0, 0, 0);

  const twoHourReminder = new Date(
    appointmentAt.getTime() - 2 * 60 * 60 * 1000
  );

  return {
    dayBeforeReminder,
    twoHourReminder,
  };
};