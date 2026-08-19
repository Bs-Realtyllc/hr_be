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

export async function uploadCitizenship(userId: number, side: string, filename: string) {
  if (!['front', 'back'].includes(side)) throw new AppError('Invalid side', 400);
  const col = side === 'front' ? 'citizenship_front' : 'citizenship_back';

  const oldDoc = await employeeRepo.findCitizenshipDocById(userId, col);
  if (oldDoc) deleteUpload('docs', oldDoc);
  await employeeRepo.updateCitizenshipDoc(userId, col, filename);
}

export function deleteUpload(folder: string, filename: string) {
  const fs = require('fs');
  const path = require('path');
  const full = path.join(process.cwd(), 'uploads', folder, filename);
  fs.unlink(full, () => {});
}
