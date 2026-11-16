import * as employeeRepo from '../repositories/employee.repository';
import AppError from '../pkg/AppError';
import type { ProfileUpdateInput } from '../dtos/profile.dto';
const cultureEventService = require('../services/cultureEventService');

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
