-- Adds updated_at/updated_by to performance_reviews as part of converting
-- the Performance domain. No separate created_by column — reviewer_id
-- already identifies who created/owns the review, same rationale as
-- goals.created_by / meetings.created_by. performance_reviews already has
-- created_at.
USE hr_platform;

ALTER TABLE performance_reviews
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN updated_by INT NULL AFTER updated_at,
  ADD CONSTRAINT fk_performance_reviews_updated_by FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;
