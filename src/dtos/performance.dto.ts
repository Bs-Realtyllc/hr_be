import { z } from 'zod';
import { bindAndValidate, optionalNullable } from '../pkg/validation';

const ratingSchema = optionalNullable(z.coerce.number().min(0).max(5));
const categoryRatingsSchema = z.record(z.string(), z.coerce.number()).default({});

const createBodySchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  reviewer_id: z.coerce.number().int().positive(),
  review_period: z.string().trim().min(1, 'review_period is required'),
  overall_rating: ratingSchema,
  category_ratings: categoryRatingsSchema,
  strengths: optionalNullable(z.string()),
  improvements: optionalNullable(z.string()),
  manager_comments: optionalNullable(z.string()),
});

export interface PerformanceCreateInput {
  employee_id: number;
  reviewer_id: number;
  review_period: string;
  overall_rating: number | null;
  category_ratings: Record<string, number>;
  strengths: string | null;
  improvements: string | null;
  manager_comments: string | null;
}

export function toCreateInput(body: unknown, reviewerId: number): PerformanceCreateInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(createBodySchema, {
    employee_id: b?.employee_id,
    reviewer_id: reviewerId,
    review_period: b?.review_period,
    overall_rating: b?.overall_rating ?? null,
    category_ratings: b?.category_ratings || {},
    strengths: b?.strengths || null,
    improvements: b?.improvements || null,
    manager_comments: b?.manager_comments || null,
  });
  return {
    employee_id: parsed.employee_id,
    reviewer_id: parsed.reviewer_id,
    review_period: parsed.review_period,
    overall_rating: parsed.overall_rating ?? null,
    category_ratings: parsed.category_ratings,
    strengths: parsed.strengths ?? null,
    improvements: parsed.improvements ?? null,
    manager_comments: parsed.manager_comments ?? null,
  };
}

const updateBodySchema = z.object({
  overall_rating: ratingSchema,
  category_ratings: categoryRatingsSchema,
  strengths: optionalNullable(z.string()),
  improvements: optionalNullable(z.string()),
  manager_comments: optionalNullable(z.string()),
});

export interface PerformanceUpdateInput {
  overall_rating: number | null;
  category_ratings: Record<string, number>;
  strengths: string | null;
  improvements: string | null;
  manager_comments: string | null;
}

export function toUpdateInput(body: unknown): PerformanceUpdateInput {
  const b = body as Record<string, any>;
  const parsed = bindAndValidate(updateBodySchema, {
    overall_rating: b?.overall_rating ?? null,
    category_ratings: b?.category_ratings || {},
    strengths: b?.strengths || null,
    improvements: b?.improvements || null,
    manager_comments: b?.manager_comments || null,
  });
  return {
    overall_rating: parsed.overall_rating ?? null,
    category_ratings: parsed.category_ratings,
    strengths: parsed.strengths ?? null,
    improvements: parsed.improvements ?? null,
    manager_comments: parsed.manager_comments ?? null,
  };
}
