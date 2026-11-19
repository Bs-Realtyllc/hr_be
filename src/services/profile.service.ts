import * as employeeRepo from '../repositories/employee.repository';
import AppError from '../pkg/AppError';
import type { ProfileUpdateInput } from '../dtos/profile.dto';
const cultureEventService = require('../services/cultureEventService');
import { FIELD_DESTINATIONS } from '../middleware/uplod';
import { employeeDocKey, signMediaToken } from '../middleware/auth';
import path from 'path';

export async function getProfile(userId: number) {
  const emp = await employeeRepo.findProfileById(userId);
  if (!emp) throw new AppError('Employee not found', 404);
  return emp;
}

export async function updateProfile(userId: number, updates: ProfileUpdateInput, dobFromBody: string | undefined) {
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);
  
  await employeeRepo.update(userId, updates as any, userId);

  if (dobFromBody) await cultureEventService.upsertBirthdayEvent(userId, dobFromBody);
}

export async function uploadPhoto(userId: number, filename: string) {
  const oldPicture = await employeeRepo.findProfilePictureById(userId);
  if (oldPicture) deleteUpload('profile', oldPicture);
  await employeeRepo.updateProfilePicture(userId, filename);
}

export function deleteUpload(folder: string, filename: string) {
  const fs = require('fs');
  const path = require('path');
  const full = path.join(process.cwd(), 'uploads', folder, filename);
  fs.unlink(full, () => {});
}

// Saves each document for the employee. If a document with the same name
// already exists, only its filename is replaced. Old files stay in /uploads.
export async function saveDocuments(
  userId: number,
  documents: { name: string; filename: string }[],
) {
  await employeeRepo.upsertDocuments(userId, documents);
}

// Document names are a FIELD_DESTINATIONS key plus an optional index
// (educationCertificate0), so match on the key with the digits stripped.
function destinationFor(name: string): string | undefined {
  const key = Object.keys(FIELD_DESTINATIONS).find(
    (k) => name === k || (name.startsWith(k) && /^\d+$/.test(name.slice(k.length))),
  );
  return key ? FIELD_DESTINATIONS[key] : undefined;
}

// Each url is a 15-minute signed link, because <img>/<a> can't send the
// Authorization header that /uploads requires.
export async function getAllDocs(userId: number, apiBase: string) {
  const files = await employeeRepo.getAllDocsOfId(userId);
  return files.map((file) => ({
    ...file,
    url: destinationFor(file.name)
      ? `${apiBase}/profile/employee-docs/${file.id}/file?token=${signMediaToken(employeeDocKey(file.id))}`
      : undefined,
  }));
}

export async function getDocFilePath(docId: number) {
  const doc = await employeeRepo.getDocById(docId);
  const folder = doc && destinationFor(doc.name);
  if (!doc || !folder) throw new AppError('Document not found', 404);
  return {
    filePath: path.join(process.cwd(), folder, path.basename(doc.filename)),
    filename: doc.filename,
  };
}
