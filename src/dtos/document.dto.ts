import AppError from '../pkg/AppError';

export interface DocumentUploadInput {
  type: string;
  title: string;
  category: string;
  parentId: number;
}

export function toUploadInput(body: unknown, hasFile: boolean): DocumentUploadInput {
  const b = body as Record<string, any>;
  let parentId;
  if (!b?.type || !b?.title) {
    throw new AppError('type and title are required', 400);
  }
  // console.log(b.type,!(b.type === 'file'), !(b.type === 'folder'))
  if(!(b.type === 'file') && !(b.type === 'folder')){
    throw new AppError('Invalid type', 400)
  }
  if (!hasFile && b.type === 'file') {
    throw new AppError('No file uploaded', 400);
  }
  if(b.parentId === '' || !b.parentId){
    parentId = null
  }else{
    parentId = b.parentId;
  }
  return { type: b.type, title: b.title, category: b.category, parentId};
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
