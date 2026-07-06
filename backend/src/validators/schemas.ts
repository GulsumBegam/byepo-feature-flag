import { z } from "zod";

export const superAdminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const orgAdminSignupSchema = z.object({
  organizationName: z.string().trim().min(2, "Organization name is too short"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const orgAdminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is too short"),
});

export const createFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Flag key is too short")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only (e.g. dark_mode)"),
});

export const updateFlagSchema = z.object({
  enabled: z.boolean(),
});

export const checkFlagSchema = z.object({
  key: z.string().trim().min(1, "Flag key is required"),
});
