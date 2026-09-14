-- Adds fields to projects so they can be surfaced on the public GITGI roadmap.
-- roadmap_key: slug that maps this project to a NEAR_TERM entry on the website.
-- roadmap_label: the "Due Month YYYY" badge label shown on the roadmap card.
-- public_link: optional live URL shown as an external link on the roadmap.
USE hr_platform;

ALTER TABLE projects
  ADD COLUMN roadmap_key VARCHAR(50) DEFAULT NULL AFTER status,
  ADD COLUMN roadmap_label VARCHAR(100) DEFAULT NULL AFTER roadmap_key,
  ADD COLUMN public_link VARCHAR(255) DEFAULT NULL AFTER roadmap_label;
