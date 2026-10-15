import { Request, Response } from 'express';
import * as notificationPreferenceService from '../services/notificationPreference.service';
import * as notificationPreferenceDto from '../dtos/notificationPreference.dto';
import asyncHandler from '../middleware/asyncHandler';

export const getPreferences = asyncHandler(async (req: any, res: Response) => {
  const preferences = await notificationPreferenceService.getPreferences(req.user.id, req.user.role);
  res.json(preferences);
});

export const updatePreferences = asyncHandler(async (req: any, res: Response) => {
  const input = notificationPreferenceDto.toUpdatePreferencesInput(req.body);
  await notificationPreferenceService.updatePreferences(req.user.id, req.user.role, input.preferences, req.user.id);
  res.json({ success: true });
});
