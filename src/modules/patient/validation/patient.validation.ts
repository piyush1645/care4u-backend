import { z } from "zod";
import { Gender, BloodGroup } from "../../../databases/generated/client.js";

export const registerPatientSchema = z.object({
  firstName: z.string({ error: "First name is required" })
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),

  middleName: z.string()
    .min(2, "Middle name must be at least 2 characters")
    .max(50, "Middle name must not exceed 50 characters")
    .optional(),

  lastName: z.string({ error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),

  email: z.string({ error: "Email is required" })
    .email("Invalid email address"),

  mobile: z.string({ error: "Mobile is required" })
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid mobile number"),

  dateOfBirth: z.string({ error: "Date of birth is required" })
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),

  gender: z.enum(
    Object.values(Gender) as [string, ...string[]],
    {
      error: "Gender is required",
    }
  ),

  bloodGroup: z.enum(
    Object.values(BloodGroup) as [string, ...string[]],
    {
      error: "Blood group is required",
    }
  ),

  password: z.string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  confirmPassword: z.string({ error: "Confirm password is required" })

}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  }
);

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;

export const updatePatientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50).optional(),
  middleName: z.string().min(2, "Middle name must be at least 2 characters").max(50).optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50).optional(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format").optional(),
  gender: z.enum(Object.values(Gender) as [string, ...string[]]).optional(),
  bloodGroup: z.enum(Object.values(BloodGroup) as [string, ...string[]]).optional(),
  profilePhoto: z.string().optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;


export const bookAppointmentSchema = z.object({

  doctorId: z.string({ error: 'Doctor is required' })
    .min(1, 'Doctor is required'),

  appointmentDate: z.string({ error: 'Appointment date is required' })
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
    .refine(val => new Date(val) >= new Date(new Date().setHours(0,0,0,0)),
      'Appointment date cannot be in the past'),

  appointmentStartTime: z.string({ error: 'Appointment time is required' })
    .refine(val => !isNaN(Date.parse(val)), 'Invalid time format')

});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;