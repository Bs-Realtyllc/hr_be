import { Response } from 'express';
import * as profileService from '../services/profile.service';
import * as profileDto from '../dtos/profile.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const emp = await profileService.getProfile(req.user.id);
  res.json(emp);
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const updates = profileDto.toUpdateInput(req.body);
  await profileService.updateProfile(req.user.id, updates, req.body.dob);
  res.json({ success: true });
});

export const uploadPhoto = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  try {
    await profileService.uploadPhoto(req.user.id, req.file.filename);
    res.json({ filename: req.file.filename });
  } catch (err) {
    profileService.deleteUpload('profile', req.file.filename);
    throw err;
  }
});

export const uploadCitizenship = asyncHandler(async (req: any, res: Response) => {
  const { side } = req.params;
  if (!['front', 'back'].includes(side)) throw new AppError('Invalid side', 400);
  if (!req.file) throw new AppError('No file uploaded', 400);

  try {
    await profileService.uploadCitizenship(req.user.id, side, req.file.filename);
    res.json({ filename: req.file.filename });
  } catch (err) {
    profileService.deleteUpload('docs', req.file.filename);
    throw err;
  }
});
