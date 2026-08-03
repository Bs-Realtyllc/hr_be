-- Lets admins pin a document (e.g. handbook, onboarding guide) to the top of its list.
ALTER TABLE policies
  ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
