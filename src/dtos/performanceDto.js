const { z } = require('zod');

// Frontend uses a 5-star scale (see performance/page.tsx) — DB column is
// DECIMAL(2,1) which technically allows up to 9.9, but 0-5 is the real business rule.
const ratingSchema = z.coerce.number().min(0).max(5).nullable();
const categoryRatingsSchema = z.record(z.string(), z.coerce.number()).default({});

function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new Error(result.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  return result.data;
}

const createSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  reviewer_id: z.coerce.number().int().positive(),
  review_period: z.string().trim().min(1, 'review_period is required'),
  overall_rating: ratingSchema,
  category_ratings: categoryRatingsSchema,
  strengths: z.string().nullable(),
  improvements: z.string().nullable(),
  manager_comments: z.string().nullable(),
});

exports.toCreateInput = (body, reviewerId) => parseOrThrow(createSchema, {
  employee_id: body.employee_id,
  reviewer_id: reviewerId,
  review_period: body.review_period,
  overall_rating: body.overall_rating ?? null,
  category_ratings: body.category_ratings || {},
  strengths: body.strengths || null,
  improvements: body.improvements || null,
  manager_comments: body.manager_comments || null,
});

const updateSchema = z.object({
  overall_rating: ratingSchema,
  category_ratings: categoryRatingsSchema,
  strengths: z.string().nullable(),
  improvements: z.string().nullable(),
  manager_comments: z.string().nullable(),
});

exports.toUpdateInput = (body) => parseOrThrow(updateSchema, {
  overall_rating: body.overall_rating ?? null,
  category_ratings: body.category_ratings || {},
  strengths: body.strengths || null,
  improvements: body.improvements || null,
  manager_comments: body.manager_comments || null,
});
