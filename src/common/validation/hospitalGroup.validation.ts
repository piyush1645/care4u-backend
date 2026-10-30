import * as z from 'zod';

export const CreateHospitalGroupSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Hospital group name must be at least 2 characters')
        .max(100, 'Hospital group name cannot exceed 100 characters'),

    logo: z
        .string()
});
