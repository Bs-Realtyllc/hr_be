-- Groups documents into sidebar sections. All categories go through the same
-- sign-and-upload flow — this only controls where a document is listed.
ALTER TABLE policies
  ADD COLUMN category VARCHAR(30) NOT NULL DEFAULT 'policy';
