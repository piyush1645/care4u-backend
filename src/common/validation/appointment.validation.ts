import { z } from "zod";
import { CreatePaymentSchema } from "./payment.validation.js";

export const CreateAppointmentSchema = z
  .object({
    appointmentDate: z.coerce.date(),
    appointmentStartTime: z.coerce.date(),

    patientId: z.coerce.bigint().optional(),
    type: z.enum(["IN_PERSON","ONLINE"]),
    bookedBy: z.enum(["SELF", "STAFF"]),

    doctorId: z.coerce.bigint(),
    hospitalId: z.coerce.bigint(),

    paidBy: z.string().optional(),

    payment: CreatePaymentSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.bookedBy === "STAFF" && !data.patientId) {
      ctx.addIssue({
        code: "custom",
        path: ["patientId"],
        message:
          "Patient ID is required when appointment is booked by staff",
      });
    }
  });

export const RescheduleAppointmentSchema = z.object({
  appointmentDate: z.coerce.date(),
  appointmentStartTime: z.coerce.date(),
});

export type CreateAppointmentInput = z.infer<
  typeof CreateAppointmentSchema
>;