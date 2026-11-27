import AppError from '../pkg/AppError';

export interface DocumentUploadInput {
  type: 'file' | 'folder';
  documentType: string | null;
  title: string;
  category: string | null;
  parentId: number | null;
  requiresAcknowledgement: boolean;
}

export function toUploadInput(body: unknown, hasFile: boolean): DocumentUploadInput {
  const b = body as Record<string, any>;

  if (!b?.type || !b?.title) {
    throw new AppError('type and title are required', 400);
  }
  if (b.type !== 'file' && b.type !== 'folder') {
    throw new AppError('type must be "file" or "folder"', 400);
  }
  if (!hasFile && b.type === 'file') {
    throw new AppError('No file uploaded', 400);
  }

  const parentId = b.parentId === '' || b.parentId == null ? null : Number(b.parentId);
  const documentType = b.documentType?.trim() || null;
  const requiresAcknowledgement = b.requiresAcknowledgement === true || b.requiresAcknowledgement === 'true';

  return {
    type: b.type,
    documentType,
    title: b.title,
    category: b.category?.trim() || null,
    parentId,
    requiresAcknowledgement,
  };
}

export interface DocumentRenameInput {
  name: string;
}

export function toRenameInput(body: unknown): DocumentRenameInput {
  const b = body as Record<string, any>;
  const name = typeof b?.name === 'string' ? b.name.trim() : '';
  if (!name) {
    throw new AppError('name is required', 400);
  }
  if (name.length > 200) {
    throw new AppError('name must be at most 200 characters', 400);
  }
  return { name };
}

// --- Acknowledgement DTOs ---

export interface AcknowledgementSubmitInput {
  documentId: number;
  signedFilePath: string | null;
}

export function toSubmitInput(documentId: unknown, signedFilename: string | null): AcknowledgementSubmitInput {
  const id = Number(documentId);
  if (!id || id < 1) {
    throw new AppError('Invalid document id', 400);
  }
  return { documentId: id, signedFilePath: signedFilename };
}

export interface AcknowledgementReviewInput {
  status: 'approved' | 'rejected';
  rejectionReason: string | null;
}

export function toReviewInput(body: unknown): AcknowledgementReviewInput {
  const b = body as Record<string, any>;
  if (!['approved', 'rejected'].includes(b?.status)) {
    throw new AppError("status must be 'approved' or 'rejected'", 400);
  }
  if (b.status === 'rejected' && !b?.rejectionReason?.trim()) {
    throw new AppError('rejectionReason is required when rejecting', 400);
  }
  return {
    status: b.status,
    rejectionReason: b.status === 'rejected' ? b.rejectionReason : null,
  };
}
