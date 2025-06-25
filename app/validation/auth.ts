import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const phoneLoginSchema = z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    otp: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;