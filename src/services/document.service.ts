import * as documentRepo from '../repositories/document.repository';
import AppError from '../pkg/AppError';

export async function listDocuments(parentId?: number | null, documentType?: string | null) {
  return documentRepo.listActive(parentId, documentType);
}

export async function uploadDocument(
  {
    type,
    documentType,
    title,
    category,
    parentId,
    requiresAcknowledgement,
  }: {
    type: string;
    documentType: string | null;
    title: string;
    category: string | null;
    parentId: number | null;
    requiresAcknowledgement: boolean;
  },
  filename: string | null,
  uploadedBy: number,
) {
  const id = await documentRepo.create({
    type,
    documentType,
    title,
    filePath: filename ?? null,
    uploadedBy,
    category,
    parentId,
    requiresAcknowledgement,
  });

  return { id };
}

export async function removeDocument(id: string) {
  const document: any = await documentRepo.findById(id);
  if (!document) throw new AppError('Document not found', 404);
  await documentRepo.remove(id);
  return document;
}

export async function setPinned(id: string, pinned: boolean) {
  const document: any = await documentRepo.findById(id);
  if (!document) throw new AppError('Document not found', 404);
  await documentRepo.setPinned(id, pinned);
}

export async function renameDocument(id: string, name: string) {
  return documentRepo.rename(id, name);
}

export async function getFileById(id: number) {
  const doc = await documentRepo.getById(id);
  if (!doc) throw new AppError('Document not found', 404);
  if (doc.type !== 'file') throw new AppError('Only a file can be opened', 400);
  return doc;
}

export async function move(id: number, newParentId: number | null) {
  const doc = await documentRepo.findById(id);
  if (!doc) throw new AppError('Requested file/folder could not be found', 404);
  if (doc.parentId === newParentId) throw new AppError('Already inside the requested folder', 400);
  if (newParentId) {
    const newParent = await documentRepo.findById(newParentId);
    if (!newParent) throw new AppError('Target folder not found', 404);
    if (newParent.type === 'file') throw new AppError('Cannot use a file as a parent', 400);
  }
  return documentRepo.changeParentId(id, newParentId);
}
