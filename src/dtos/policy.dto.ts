import AppError from '../pkg/AppError';

// The old controllers/policies.js validated these fields inline rather than
// through a dedicated dto file — kept as plain checks here for the same
// reason (type/title/file come from a multipart form alongside the upload,
// not a clean JSON body worth a full Zod schema).

export interface PolicyUploadInput {
  type: string;
  title: string;
  category: string;
}

export function toUploadInput(body: unknown, hasFile: boolean): PolicyUploadInput {
  const b = body as Record<string, any>;
  if (!b?.type || !b?.title) {
    throw new AppError('type and title are required', 400);
  }
  if (!hasFile) {
    throw new AppError('No file uploaded', 400);
  }
  return { type: b.type, title: b.title, category: b.category || 'policy' };
}

export interface AcknowledgementReviewInput {
  status: 'approved' | 'rejected';
  rejection_reason: string | null;
}

export function toReviewInput(body: unknown): AcknowledgementReviewInput {
  const b = body as Record<string, any>;
  if (!['approved', 'rejected'].includes(b?.status)) {
    throw new AppError("status must be 'approved' or 'rejected'", 400);
  }
  if (b.status === 'rejected' && !b?.rejection_reason?.trim()) {
    throw new AppError('rejection_reason is required when rejecting', 400);
  }
  return { status: b.status, rejection_reason: b.status === 'rejected' ? b.rejection_reason : null };
}
