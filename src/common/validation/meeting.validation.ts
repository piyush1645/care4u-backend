import { z } from "zod";

export const CreateMeetingSchema = z.object({
  startTime: z.coerce.date(),

  link: z.string().trim().min(1).max(255),

  status: z
    .enum(["UPCOMING", "IN_PROGRESS", "COMPLETED"])
    .default("UPCOMING"),

  appointmentId: z.coerce.bigint(),

  doctorId: z.coerce.bigint(),

  patientId: z.coerce.bigint(),
  joinUrl: z.coerce.string(),
  startUrl: z.coerce.string(),
  password: z.coerce.string()
});