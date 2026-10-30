import { z } from "zod";

export const AttachmentTypeSchema = z.enum([
  "PRESCRIPTION",
  "REPORT",
]);

export const CreateAttachmentSchema = z.object({
  url: z
    .string()
    .url("Attachment URL must be a valid URL"),

  secretKey: z
    .string()
    .nullable()
    .optional(),

  type: AttachmentTypeSchema,

  prescriptionId: z
    .coerce
    .number()
    .int()
    .positive("Prescription ID must be a positive number"),
});
