import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as documentService from '../services/document.service';
import * as documentDto from '../dtos/document.dto';
import asyncHandler from '../middleware/asyncHandler';
import AppError from '../pkg/AppError';

export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.query;

  let parent: number | null = null;
  if (parentId !== undefined && parentId !== "") {
    parent = Number(parentId);
    if (!Number.isInteger(parent) || parent < 1) {
      res.status(400).json({ message: "Invalid parentId" });
      return;
    }
  }

  const documents = await documentService.listDocuments(parent);
  res.json(documents);
});

export const uploadDocument = asyncHandler(async (req: any, res: Response) => {
  const input = documentDto.toUploadInput(req.body, !!req.file);

  try {
    const { id } = await documentService.uploadDocument(input, req.file?.filename ?? null, req.user.id);

    res.json({ id });
  } catch (err) {
    if(input.type === 'file'){
      deleteUpload(req.file.filename);
    }
    throw err;
  }
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const document: any = await documentService.removeDocument(req.params.id);
  if(document.type === 'file' && document.filePath){
    deleteUpload(document.filePath);
  }
  res.json({ success: true });
});

export const setPinned = asyncHandler(async (req: Request, res: Response) => {
  const { pinned } = req.body;
  await documentService.setPinned(req.params.id, !!pinned);
  res.json({ success: true });
});

export const renameDocument = asyncHandler(async (req: Request, res: Response) => {
  const { name } = documentDto.toRenameInput(req.body);
  const renamed = await documentService.renameDocument(req.params.id, name);
  res.status(renamed ? 200 : 404).json({ success: renamed });
});

function deleteUpload(filename: string) {
  const full = path.join(process.cwd(), 'uploads/policies', filename);
  fs.unlink(full, () => {});
}

export const openFile = asyncHandler(async (req:Request, res: Response)=>{
  const id = Number(req.params.id);
  if(!id){
    throw new AppError('id cannot be null', 400)
  }
  const file = await documentService.getFileById(id);
  const filePath = path.join(process.cwd(),"uploads/policies", file.filePath);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File is missing.", 404);
  }
  res.setHeader("Content-Disposition", `inline; filename="${file.filePath}"`);
  res.sendFile(filePath);
})

export const move = asyncHandler(async (req:Request, res: Response)=>{
  const id = Number(req.params.id);
  const {newParentId} = req.body ?? null;
  if(!id){
    throw new AppError('Id cannot be null', 400)
  }
  const result = await documentService.move(id, newParentId);
  res.status(200). json(result)
})