import { z } from 'zod';

// Common validation schemas for NUSKA_etno

export const paginationSchema = z.object({
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
  page: z.number().optional().default(1),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

export const idSchema = z.string().uuid();

export const nameSchema = z.string().min(1).max(255);

export const descriptionSchema = z.string().max(10000).optional();

export const emailSchema = z.string().email();

export const phoneSchema = z.string().min(10).max(20);

export const passwordSchema = z.string().min(8).max(128);

// User validators
export const userRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: phoneSchema.optional(),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Order validators
export const orderCreateSchema = z.object({
  pickupLocationId: z.string().uuid(),
  pickupTime: z.coerce.date().optional(),
  customerComment: z.string().max(500).optional(),
});

// Product validators
export const productCreateSchema = z.object({
  sku: z.string().min(1).max(50),
  slug: z.string().min(1).max(255),
  type: z.enum(['FOOD', 'BEVERAGE']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  priceAmount: z.number().int().min(0),
  currency: z.string().max(3).default('KGS'),
  stockQuantity: z.number().int().min(0).default(0),
  trackInventory: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

// Category validators
export const categoryCreateSchema = z.object({
  parentId: z.string().uuid().optional(),
  slug: z.string().min(1).max(255),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Validation error types
export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationProblemDetails = {
  errors: ValidationError[];
  message?: string;
};
