import { Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import * as inboxService from '../services/inbox.service';
import { uploadAudioToMinio, streamAudioFromMinio } from '../services/minio.service';

/* ── Categories ───────────────────────────────────────────── */

export const listCategories = asyncHandler(async (_req: any, res: Response) => {
  const categories = await inboxService.listCategories();
  res.json(categories);
});

export const createCategory = asyncHandler(async (req: any, res: Response) => {
  const { name, position } = req.body;
  const category = await inboxService.createCategory(req.user, name, position);

  const io = req.app.get('io');
  if (io) io.emit('category:created', category);

  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: any, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name, position } = req.body;
  const result = await inboxService.updateCategory(req.user, id, { name, position });

  const io = req.app.get('io');
  if (io) io.emit('category:updated', { id, name, position });

  res.json(result);
});

export const deleteCategory = asyncHandler(async (req: any, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const result = await inboxService.deleteCategory(req.user, id);

  const io = req.app.get('io');
  if (io) io.emit('category:deleted', { id });

  res.json(result);
});

/* ── Channels ─────────────────────────────────────────────── */

export const listChannels = asyncHandler(async (req: any, res: Response) => {
  const channels = await inboxService.listChannels(req.user);
  res.json(channels);
});

export const createChannel = asyncHandler(async (req: any, res: Response) => {
  const { name, type, description, required_role, category_id, is_private } = req.body;
  const channel = await inboxService.createChannel(req.user, {
    name, type, description, required_role, category_id, is_private,
  });

  const io = req.app.get('io');
  if (io) io.emit('channel:created', channel);

  res.status(201).json(channel);
});

export const updateChannel = asyncHandler(async (req: any, res: Response) => {
  const channelId = parseInt(req.params.channelId, 10);
  const { name, description, required_role, is_private, category_id } = req.body;
  const channel = await inboxService.updateChannel(req.user, channelId, {
    name, description, required_role, is_private, category_id,
  });

  const io = req.app.get('io');
  if (io) io.emit('channel:updated', channel);

  res.json(channel);
});

export const deleteChannel = asyncHandler(async (req: any, res: Response) => {
  const channelId = parseInt(req.params.channelId, 10);
  const result = await inboxService.deleteChannel(req.user, channelId);

  const io = req.app.get('io');
  if (io) io.emit('channel:deleted', result);

  res.json(result);
});

export const markChannelRead = asyncHandler(async (req: any, res: Response) => {
  const channelId = parseInt(req.params.channelId, 10);
  const result = await inboxService.markChannelRead(req.user, channelId);
  res.json(result);
});

export const setMemberRole = asyncHandler(async (req: any, res: Response) => {
  const channelId   = parseInt(req.params.channelId, 10);
  const employeeId  = parseInt(req.params.employeeId, 10);
  const { role }    = req.body;
  const result = await inboxService.setMemberRole(req.user, channelId, employeeId, role);
  res.json(result);
});

export const removeMember = asyncHandler(async (req: any, res: Response) => {
  const channelId  = parseInt(req.params.channelId, 10);
  const employeeId = parseInt(req.params.employeeId, 10);
  const result = await inboxService.removeMember(req.user, channelId, employeeId);
  res.json(result);
});

/* ── Channel Messages ─────────────────────────────────────── */

export const getMessages = asyncHandler(async (req: any, res: Response) => {
  const channelId = parseInt(req.params.channelId, 10);
  const limit     = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
  const before    = req.query.before as string | undefined;
  const messages  = await inboxService.getMessages(channelId, limit, before);
  res.json(messages);
});

export const sendMessage = asyncHandler(async (req: any, res: Response) => {
  const channelId   = parseInt(req.params.channelId, 10);
  const { content, reply_to_id } = req.body;
  const msg = await inboxService.sendMessage(req.user, channelId, content, reply_to_id);

  const io = req.app.get('io');
  if (io) io.to(`channel:${channelId}`).emit('message:new', msg);

  res.status(201).json(msg);
});

export const editMessage = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const { content } = req.body;
  const result = await inboxService.editMessage(req.user, messageId, content);

  const io = req.app.get('io');
  if (io) io.to(`channel:${result.id}`).emit('message:edited', result);

  res.json(result);
});

export const deleteMessage = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const result = await inboxService.deleteMessage(req.user, messageId);

  const io = req.app.get('io');
  if (io) io.emit('message:deleted', result);

  res.json(result);
});

export const togglePin = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const result = await inboxService.togglePin(req.user, messageId);
  res.json(result);
});

/* ── Reactions ────────────────────────────────────────────── */

export const toggleReaction = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const { emoji } = req.body;
  const result = await inboxService.toggleReaction(req.user, messageId, emoji);

  const io = req.app.get('io');
  if (io) io.emit(`reaction:updated:${messageId}`, result);

  res.json(result);
});

/* ── Direct Messages ──────────────────────────────────────── */

export const getDmConversations = asyncHandler(async (req: any, res: Response) => {
  const convs = await inboxService.getDmConversations(req.user);
  res.json(convs);
});

export const getDmMessages = asyncHandler(async (req: any, res: Response) => {
  const partnerId = parseInt(req.params.partnerId, 10);
  const limit     = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
  const before    = req.query.before as string | undefined;
  const messages  = await inboxService.getDmMessages(req.user, partnerId, limit, before);
  res.json(messages);
});

export const sendDm = asyncHandler(async (req: any, res: Response) => {
  const partnerId  = parseInt(req.params.partnerId, 10);
  const { content } = req.body;
  const result = await inboxService.sendDm(req.user, partnerId, content);

  const io = req.app.get('io');
  if (io) {
    const payload = { ...result, from: req.user.id, content };
    io.to(`user:${partnerId}`).emit('dm:new', payload);
  }

  res.status(201).json(result);
});

export const editDm = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const { content } = req.body;
  const result = await inboxService.editDm(req.user, messageId, content);
  res.json(result);
});

export const deleteDm = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const result = await inboxService.deleteDm(req.user, messageId);
  res.json(result);
});

/* ── Voice Presence ──────────────────────────────────────── */

export const getVoiceToken = asyncHandler(async (req: any, res: Response) => {
  const channelId = parseInt(req.params.channelId, 10);
  const result = await inboxService.getVoiceToken(req.user, channelId);
  res.json(result);
});

export const joinVoice = asyncHandler(async (req: any, res: Response) => {
  const channelId  = parseInt(req.params.channelId, 10);
  const occupants  = await inboxService.joinVoice(req.user, channelId);

  const io = req.app.get('io');
  if (io) io.emit(`voice:presence:${channelId}`, occupants);

  res.json(occupants);
});

export const leaveVoice = asyncHandler(async (req: any, res: Response) => {
  const channelId = parseInt(req.params.channelId, 10);
  const occupants = await inboxService.leaveVoice(req.user, channelId);

  const io = req.app.get('io');
  if (io) io.emit(`voice:presence:${channelId}`, occupants);

  res.json(occupants);
});

export const getVoicePresence = asyncHandler(async (_req: any, res: Response) => {
  const presence = await inboxService.getVoicePresence();
  res.json(presence);
});

/* ── Pinned messages ─────────────────────────────────────── */

export const getPinnedMessages = asyncHandler(async (req: any, res: Response) => {
  const channelId = parseInt(req.params.channelId, 10);
  const pins = await inboxService.getPinnedMessages(channelId);
  res.json(pins);
});

/* ── Save / unsave ───────────────────────────────────────── */

export const saveMessage = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const result = await inboxService.saveMessage(req.user, messageId);
  res.status(201).json(result);
});

export const unsaveMessage = asyncHandler(async (req: any, res: Response) => {
  const messageId = parseInt(req.params.messageId, 10);
  const result = await inboxService.unsaveMessage(req.user, messageId);
  res.json(result);
});

export const getSavedMessages = asyncHandler(async (req: any, res: Response) => {
  const msgs = await inboxService.getSavedMessages(req.user);
  res.json(msgs);
});

/* ── Forward message ─────────────────────────────────────── */

export const forwardMessage = asyncHandler(async (req: any, res: Response) => {
  const messageId  = parseInt(req.params.messageId, 10);
  const { targetId, targetType } = req.body;
  const result = await inboxService.forwardMessage(req.user, messageId, Number(targetId), targetType);

  const io = req.app.get('io');
  if (io && targetType === 'channel') io.to(`channel:${targetId}`).emit('message:new', { channel_id: targetId });

  res.status(201).json(result);
});

/* ── User Presence ───────────────────────────────────────── */

export const updatePresence = asyncHandler(async (req: any, res: Response) => {
  const { status } = req.body;
  const result = await inboxService.updatePresence(req.user, status);

  const io = req.app.get('io');
  if (io) io.emit('presence:update', result);

  res.json(result);
});

/* ── Audio upload (DM) ───────────────────────────────────── */

export const uploadDmAudio = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) throw Object.assign(new Error('No audio file uploaded'), { status: 400 });
  const key = await uploadAudioToMinio(req.file.buffer, req.file.mimetype);
  const host = `${req.protocol}://${req.get('host')}`;
  const proxyUrl = `${host}/api/inbox/audio/${encodeURIComponent(key)}`;
  res.status(201).json({ key, presignedUrl: proxyUrl });
});

/* ── Audio stream (proxy from MinIO) ─────────────────────── */

export const streamAudio = asyncHandler(async (req: any, res: Response) => {
  const key = req.params.key as string;
  if (!key || key.includes('..') || key.includes('/'))
    throw Object.assign(new Error('Invalid audio key'), { status: 400 });
  const { stream, size, contentType } = await streamAudioFromMinio(key);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  stream.pipe(res);
});
