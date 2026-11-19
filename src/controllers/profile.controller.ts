import { Response } from 'express';
import * as profileService from '../services/profile.service';
import * as profileDto from '../dtos/profile.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';
import fs from 'fs/promises';

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

// Used by all PATCH /profile/docs/* routes. Multer has already saved the files
// in /uploads; this saves them in employee_documents.
// The document name is the field name without "_":
//   idFront -> idFront,  educationCertificate_0 -> educationCertificate0
export const uploadDocuments = asyncHandler(async (req: any, res: Response) => {
  const files: Express.Multer.File[] = Object.values(req.files ?? {}).flat() as any;
  if (!files.length) throw new AppError('No file uploaded', 400);

  const documents = files.map((file) => ({
    name: file.fieldname.replace('_', ''),
    filename: file.filename,
  }));

  try {
    await profileService.saveDocuments(req.user.id, documents);
    res.json({ documents });
  } catch (err) {
    // Saving to the DB failed, so remove the files uploaded in this request.
    await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
    throw err;
  }
});

export const getAllDocs = asyncHandler(async(req: any, res: Response)=>{
  const id = req.user.id;
  const apiBase = process.env.API_BASE_URL ?? `${req.protocol}://${req.get("host")}/api`;
  const filesWithPath = await profileService.getAllDocs(Number(id), apiBase);
  res.status(200).json({status: "success", files: filesWithPath})

})

// Opened directly by <img>/<a>; access is checked by the ?token in the route.
export const getDocFile = asyncHandler(async (req: any, res: Response) => {
  const { filePath, filename } = await profileService.getDocFilePath(Number(req.params.id));
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath);
})