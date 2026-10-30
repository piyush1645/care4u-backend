/**
 * -module/doctor/validation/doctor.validataion.ts - Doctor joi schemas
 *
 *  Define Joi validation schema for Doctor endpoint datavalidation
 *  Use with the Validate() middleware in route definations.
 *
 */

import { z } from 'zod';

export const DoctorSpecialitySchema = z.object({
  name: z.string().trim().min(1, 'Speciality name is required'),
});

export const DoctorDegreeSchema = z.object({
  courseName: z.string().trim().min(1, 'Course name is required'),
  abbreviation: z.string().trim().min(1, 'Abbreviation is required'),
  institution: z.string().trim().min(1, 'Institution is required'),
  passingYear: z
    .number()
    .int()
    .min(1900, 'Invalid passing year')
    .max(new Date().getFullYear(), 'Passing year cannot be in the future'),
});

export const RegisterDoctorSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),

  middleName: z.string().trim().optional(),

  lastName: z.string().trim().min(1, 'Last name is required'),

  email: z.string().trim().email('Invalid email address'),

  mobile: z.string().trim(),
  password: z.string().trim(),

  profilePhoto: z.string().url('Invalid profile photo URL').optional(),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),

  dateOfBirth: z.string().date('Invalid date format (YYYY-MM-DD)'),

  preferedLanguages: z.string().trim().min(1, 'Preferred language is required'),

  experience: z.number().int().min(0).optional(),

  charges: z.number().positive('Charges must be greater than 0'),

  slotDuration: z.number().int().positive().optional(),

  hospitalId: z.coerce.bigint(),

  specialities: z.array(DoctorSpecialitySchema).min(1, 'At least one speciality is required'),

  degrees: z.array(DoctorDegreeSchema).min(1, 'At least one degree is required'),
});

export type RegisterDoctorDto = z.infer<typeof RegisterDoctorSchema>;


export const UpdateDoctorSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),

  middleName: z.string().trim().optional(),

  lastName: z.string().trim().min(1, 'Last name is required'),

  profilePhoto: z.string().url('Invalid profile photo URL').optional(),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),

  dateOfBirth: z.string().date('Invalid date format (YYYY-MM-DD)'),

  preferedLanguages: z.string().trim().min(1, 'Preferred language is required'),

  // Both spellings accepted — DB model uses the typo 'expereince'
  experience: z.number().int().min(0).optional(),
  expereince: z.number().int().min(0).optional(),

  charges: z.number().positive('Charges must be greater than 0'),

  slotDuration: z.number().int().positive().optional(),

  // hospitalId: z.coerce.bigint(),

  specialities: z.array(DoctorSpecialitySchema).min(1, 'At least one speciality is required'),

  degrees: z.array(DoctorDegreeSchema).min(1, 'At least one degree is required'),
});