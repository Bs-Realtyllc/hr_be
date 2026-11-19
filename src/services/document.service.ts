import * as documentRepo from '../repositories/document.repository';
import AppError from '../pkg/AppError';

export async function listDocuments(parentId?: number |null) {
  return documentRepo.listActive(parentId);
}

export async function uploadDocument(
  { type, title, category, parentId }: { type: string; title: string; category: string, parentId: number },
  filename: string | null,
  uploadedBy: number
) {
  // const previous: any = await documentRepo.findActiveByType(type);
  // const version = previous ? previous.version + 1 : 1;

  // await documentRepo.deactivateByType(type);
  const id = await documentRepo.create({
    type,
    title,
    filePath: filename ?? null,
    uploadedBy,
    category,
    parentId
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
  const doc =await documentRepo.getById(id);
  if(doc.type !== 'file'){
    throw new AppError('Only file can be opened', 400)
  }
  return doc
}
