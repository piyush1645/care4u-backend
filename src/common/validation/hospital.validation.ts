import { z } from "zod";
import { addressSchema } from "./address.validation.js";

export const CreateHospitalSchema = z.object({
  branchName: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name is too long"),

  photo: z
    .string()
    .url("Photo must be a valid URL")
    .optional(),

  hospitalGroupId: z
    .union([
      z.bigint(),
      z.string().regex(/^\d+$/).transform(BigInt),
    ]),

  address: addressSchema,
});

export const UpdateHospitalSchema = z.object({
  branchName: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name is too long"),

  photo: z
    .string(),

  hospitalGroupId: z
    .union([
      z.bigint(),
      z.string().regex(/^\d+$/).transform(BigInt),
    ]),

  address: addressSchema,
});