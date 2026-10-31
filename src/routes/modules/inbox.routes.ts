import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { uploadAudioMemory } from '../../middleware/uplod';
import * as ctrl from '../../controllers/inbox.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

/* ── Categories ───────────────────────────────────────────── */
router.get('/categories',                              ctrl.listCategories);
router.post('/categories',                             ctrl.createCategory);          // admin only (service-enforced)
router.patch('/categories/:id',                        ctrl.updateCategory);          // admin only
router.delete('/categories/:id',                       ctrl.deleteCategory);          // admin only

/* ── Channels ─────────────────────────────────────────────── */
router.get('/channels',                                ctrl.listChannels);
router.post('/channels',                               ctrl.createChannel);           // admin only
router.patch('/channels/:channelId',                   ctrl.updateChannel);           // admin only
router.delete('/channels/:channelId',                  ctrl.deleteChannel);           // admin only
router.post('/channels/:channelId/read',               ctrl.markChannelRead);

/* ── Channel member permissions ──────────────────────────── */
router.put('/channels/:channelId/members/:employeeId/role', ctrl.setMemberRole);     // set readonly/member/admin
router.delete('/channels/:channelId/members/:employeeId',   ctrl.removeMember);      // remove from private channel

/* ── Channel messages ─────────────────────────────────────── */
router.get('/channels/:channelId/messages',            ctrl.getMessages);
router.post('/channels/:channelId/messages',           ctrl.sendMessage);
router.patch('/messages/:messageId',                   ctrl.editMessage);
router.delete('/messages/:messageId',                  ctrl.deleteMessage);
router.patch('/messages/:messageId/pin',               ctrl.togglePin);
router.get('/channels/:channelId/pins',                ctrl.getPinnedMessages);
router.post('/messages/:messageId/save',               ctrl.saveMessage);
router.delete('/messages/:messageId/save',             ctrl.unsaveMessage);
router.get('/saved',                                   ctrl.getSavedMessages);
router.post('/messages/:messageId/forward',            ctrl.forwardMessage);

/* ── Reactions ────────────────────────────────────────────── */
router.post('/messages/:messageId/reactions',          ctrl.toggleReaction);

/* ── Direct messages ──────────────────────────────────────── */
router.get('/dms',                                     ctrl.getDmConversations);
router.post('/dms/audio',                              uploadAudioMemory.single('audio'), ctrl.uploadDmAudio);
router.get('/audio/:key',                              ctrl.streamAudio);
router.get('/dms/:partnerId/messages',                 ctrl.getDmMessages);
router.post('/dms/:partnerId/messages',                ctrl.sendDm);
router.patch('/dm-messages/:messageId',                ctrl.editDm);
router.delete('/dm-messages/:messageId',               ctrl.deleteDm);

/* ── Audio upload + stream ───────────────────────────────── */
router.post('/dms/:partnerId/audio',               upload.single('audio'), ctrl.uploadDmAudio);
router.get('/audio/:key',                          ctrl.streamAudio);

/* ── Voice presence + LiveKit token ──────────────────────── */
router.get('/voice',                                   ctrl.getVoicePresence);
router.get('/voice/:channelId/token',                  ctrl.getVoiceToken);
router.post('/voice/:channelId/join',                  ctrl.joinVoice);
router.post('/voice/:channelId/leave',                 ctrl.leaveVoice);

/* ── User presence ───────────────────────────────────────── */
router.put('/presence',                                ctrl.updatePresence);

export default router;
