exports.toCreateInput = (body, reviewerId) => ({
  employee_id: body.employee_id,
  reviewer_id: reviewerId,
  review_period: body.review_period,
  overall_rating: body.overall_rating ?? null,
  category_ratings: body.category_ratings || {},
  strengths: body.strengths || null,
  improvements: body.improvements || null,
  manager_comments: body.manager_comments || null,
});

exports.toUpdateInput = (body) => ({
  overall_rating: body.overall_rating ?? null,
  category_ratings: body.category_ratings || {},
  strengths: body.strengths || null,
  improvements: body.improvements || null,
  manager_comments: body.manager_comments || null,
});
