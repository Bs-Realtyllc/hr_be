import { AccessToken } from 'livekit-server-sdk';
import * as repo       from '../repositories/inbox.repository';
import * as mongoRepo  from '../repositories/inbox.mongo.repository';

interface AuthUser { id: number; name: string; role: string; }

/* ── Categories ───────────────────────────────────────────── */

export async function listCategories() {
  return repo.listCategories();
}

export async function createCategory(user: AuthUser, name: string, position?: number) {
  if (user.role !== 'admin') throw Object.assign(new Error('Admin only'), { status: 403 });
  const pos = position ?? (await repo.listCategories()).length;
  const id = await repo.createCategory(name, pos, user.id);
  return { id, name, position: pos };
}

export async function updateCategory(user: AuthUser, id: number, data: { name?: string; position?: number }) {
  if (user.role !== 'admin') throw Object.assign(new Error('Admin only'), { status: 403 });
  await repo.updateCategory(id, data);
  return { ok: true };
}

export async function deleteCategory(user: AuthUser, id: number) {
  if (user.role !== 'admin') throw Object.assign(new Error('Admin only'), { status: 403 });
  await repo.deleteCategory(id);
  return { ok: true };
}

/* ── Channels ─────────────────────────────────────────────── */

export async function listChannels(user?: AuthUser) {
  return repo.listChannels(user?.id, user?.role);
}

export async function createChannel(
  user: AuthUser,
  data: {
    name: string;
    type: 'text' | 'voice' | 'announcement';
    description?: string;
    required_role?: 'admin' | 'lead' | 'employee' | 'intern';
    category_id?: number;
    is_private?: boolean;
  },
) {
  if (user.role !== 'admin') throw Object.assign(new Error('Admins only'), { status: 403 });
  const slug = data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  const category = data.type === 'voice' ? 'voice' : 'text';
  const id = await repo.createChannel({
    ...data,
    name: slug,
    category,
    is_private: data.is_private ? 1 : 0,
    created_by: user.id,
  });
  return repo.findChannelById(id);
}

export async function updateChannel(
  user: AuthUser,
  channelId: number,
  data: {
    name?: string;
    description?: string;
    required_role?: 'admin' | 'lead' | 'employee' | 'intern';
    is_private?: boolean;
    category_id?: number;
  },
) {
  if (user.role !== 'admin') throw Object.assign(new Error('Admins only'), { status: 403 });
  await repo.updateChannel(channelId, {
    ...data,
    is_private: data.is_private !== undefined ? (data.is_private ? 1 : 0) : undefined,
  });
  return repo.findChannelById(channelId);
}

export async function deleteChannel(user: AuthUser, channelId: number) {
  if (user.role !== 'admin') throw Object.assign(new Error('Admins only'), { status: 403 });
  const ch = await repo.findChannelById(channelId);
  if (!ch) throw Object.assign(new Error('Channel not found'), { status: 404 });
  await repo.deleteChannel(channelId);
  return { id: channelId };
}

export async function markChannelRead(user: AuthUser, channelId: number) {
  await repo.markChannelRead(channelId, user.id);
  return { ok: true };
}

export async function setMemberRole(
  user: AuthUser,
  channelId: number,
  employeeId: number,
  role: 'admin' | 'member' | 'readonly',
) {
  if (user.role !== 'admin') {
    const myRole = await repo.getMemberRole(user.id, channelId);
    if (myRole !== 'admin') throw Object.assign(new Error('Channel admin only'), { status: 403 });
  }
  await repo.setMemberRole(channelId, employeeId, role);
  return { ok: true };
}

export async function removeMember(user: AuthUser, channelId: number, employeeId: number) {
  if (user.role !== 'admin') throw Object.assign(new Error('Admins only'), { status: 403 });
  await repo.removeMember(channelId, employeeId);
  return { ok: true };
}

/* ── LiveKit voice token ─────────────────────────────────── */

export async function getVoiceToken(user: AuthUser, channelId: number) {
  const channel = await repo.findChannelById(channelId);
  if (!channel || channel.type !== 'voice') {
    throw Object.assign(new Error('Voice channel not found'), { status: 404 });
  }

  const apiKey    = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    throw Object.assign(new Error('LiveKit not configured on this server'), { status: 503 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(user.id),
    name: user.name,
    ttl: '2h',
  });
  at.addGrant({
    roomJoin: true,
    room: `inbox-voice-${channelId}`,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return { token, url: serverUrl, room: `inbox-voice-${channelId}` };
}

/* ── Channel Messages ─────────────────────────────────────── */

export async function getMessages(channelId: number, limit = 50, before?: string) {
  const beforeDate = before ? new Date(before) : undefined;
  return mongoRepo.listChannelMessages(channelId, limit, beforeDate);
}

export async function sendMessage(
  user: AuthUser,
  channelId: number,
  content: string,
  replyToId?: string,
) {
  const trimmed = content.trim();
  if (!trimmed) throw Object.assign(new Error('Message cannot be empty'), { status: 400 });
  if (trimmed.length > 4000) throw Object.assign(new Error('Message too long (max 4000 chars)'), { status: 400 });

  const channel = await repo.findChannelById(channelId);
  if (!channel) throw Object.assign(new Error('Channel not found'), { status: 404 });
  if (channel.type === 'voice') throw Object.assign(new Error('Cannot send messages in voice channels'), { status: 400 });
  if (channel.type === 'announcement' && user.role !== 'admin' && user.role !== 'lead') {
    throw Object.assign(new Error('Only admins/leads can post in announcement channels'), { status: 403 });
  }

  const authorDesignation = await repo.getEmployeeDesignation(user.id).catch(() => '');

  let replyToContent: string | undefined;
  let replyToAuthor:  string | undefined;
  if (replyToId) {
    const parent = await mongoRepo.getChannelMessageById(replyToId);
    if (parent) { replyToContent = parent.content; replyToAuthor = parent.author_name ?? undefined; }
  }

  const id = await mongoRepo.insertChannelMessage({
    channelId, employeeId: user.id, authorName: user.name, authorDesignation,
    content: trimmed, replyToId, replyToContent, replyToAuthor,
  });

  return mongoRepo.getFullChannelMessageById(id) ?? { id };
}

export async function editMessage(user: AuthUser, messageId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw Object.assign(new Error('Content cannot be empty'), { status: 400 });
  const msg = await mongoRepo.getChannelMessageById(messageId);
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  if (msg.employee_id !== user.id) throw Object.assign(new Error('You can only edit your own messages'), { status: 403 });
  await mongoRepo.updateChannelMessageContent(messageId, user.id, trimmed);
  return { id: messageId, content: trimmed, is_edited: 1 };
}

export async function deleteMessage(user: AuthUser, messageId: string) {
  const msg = await mongoRepo.getChannelMessageById(messageId);
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  const isAdmin = user.role === 'admin';
  if (!isAdmin && msg.employee_id !== user.id) {
    throw Object.assign(new Error('You can only delete your own messages'), { status: 403 });
  }
  await mongoRepo.softDeleteChannelMessage(messageId, user.id, isAdmin);
  return { id: messageId };
}

export async function togglePin(user: AuthUser, messageId: string) {
  if (!['admin', 'lead'].includes(user.role)) {
    throw Object.assign(new Error('Admins/leads only'), { status: 403 });
  }
  const msg = await mongoRepo.getChannelMessageById(messageId);
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  const pinned = !msg.is_pinned;
  await mongoRepo.togglePinChannelMessage(messageId, !!pinned);
  return { id: messageId, is_pinned: pinned };
}

/* ── Reactions ────────────────────────────────────────────── */

export async function toggleReaction(user: AuthUser, messageId: string, emoji: string) {
  if (!emoji || emoji.length > 12) throw Object.assign(new Error('Invalid emoji'), { status: 400 });
  const msg = await mongoRepo.getChannelMessageById(messageId);
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  await mongoRepo.toggleReactionChannelMessage(messageId, user.id, emoji);
  const reactions = await mongoRepo.getReactionsForChannelMessage(messageId);
  return { message_id: messageId, reactions };
}

/* ── Direct Messages ──────────────────────────────────────── */

export async function getDmConversations(user: AuthUser) {
  const conversations = await mongoRepo.listDmConversations(user.id);
  if (conversations.length === 0) return [];

  const partnerIds = conversations.map((c: any) => c.partner_id);
  const empList    = await repo.getEmployeesByIds(partnerIds);
  const empMap     = new Map(empList.map((e: any) => [e.id, e]));

  return conversations.map((c: any) => {
    const emp = empMap.get(c.partner_id) ?? {};
    return {
      partner_id:          c.partner_id,
      partner_name:        (emp as any).name        ?? `Employee ${c.partner_id}`,
      partner_designation: (emp as any).designation ?? '',
      last_message:        c.last_message,
      last_at:             c.last_at,
      unread:              c.unread,
    };
  });
}

export async function getDmMessages(user: AuthUser, partnerId: number, limit = 50, before?: string) {
  const beforeDate = before ? new Date(before) : undefined;
  await mongoRepo.markDmMessagesRead(partnerId, user.id);
  return mongoRepo.listDmMessages(user.id, partnerId, limit, beforeDate);
}

export async function sendDm(user: AuthUser, toEmployeeId: number, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw Object.assign(new Error('Message cannot be empty'), { status: 400 });
  if (trimmed.length > 4000) throw Object.assign(new Error('Message too long (max 4000 chars)'), { status: 400 });
  if (user.id === toEmployeeId) throw Object.assign(new Error('Cannot DM yourself'), { status: 400 });
  const id = await mongoRepo.insertDmMessage({
    fromEmployeeId: user.id,
    toEmployeeId,
    content: trimmed,
    authorName: user.name,
  });
  return { id };
}

export async function editDm(user: AuthUser, messageId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw Object.assign(new Error('Content cannot be empty'), { status: 400 });
  await mongoRepo.updateDmContent(messageId, user.id, trimmed);
  return { id: messageId, content: trimmed, is_edited: 1 };
}

export async function deleteDm(user: AuthUser, messageId: string) {
  await mongoRepo.softDeleteDm(messageId, user.id);
  return { id: messageId };
}

/* ── Voice Presence ──────────────────────────────────────── */

export async function joinVoice(user: AuthUser, channelId: number) {
  const channel = await repo.findChannelById(channelId);
  if (!channel || channel.type !== 'voice') {
    throw Object.assign(new Error('Voice channel not found'), { status: 404 });
  }
  await repo.leaveAllVoiceChannels(user.id);
  await repo.joinVoiceChannel(channelId, user.id);
  return repo.getVoicePresenceByChannel(channelId);
}

export async function leaveVoice(user: AuthUser, channelId: number) {
  await repo.leaveVoiceChannel(channelId, user.id);
  return repo.getVoicePresenceByChannel(channelId);
}

export async function getVoicePresence() {
  return repo.getAllVoicePresence();
}

/* ── Pinned messages ─────────────────────────────────────── */

export async function getPinnedMessages(channelId: number) {
  return mongoRepo.getPinnedChannelMessages(channelId);
}

/* ── Save / unsave messages ──────────────────────────────── */

export async function saveMessage(user: AuthUser, messageId: string) {
  const msg = await mongoRepo.getChannelMessageById(messageId);
  if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });
  await mongoRepo.saveChannelMessage(user.id, messageId);
  return { id: messageId, saved: true };
}

export async function unsaveMessage(user: AuthUser, messageId: string) {
  await mongoRepo.unsaveChannelMessage(user.id, messageId);
  return { id: messageId, saved: false };
}

export async function getSavedMessages(user: AuthUser) {
  return mongoRepo.getSavedChannelMessages(user.id);
}

/* ── Forward message ─────────────────────────────────────── */

export async function forwardMessage(user: AuthUser, messageId: string, targetId: number, targetType: 'channel' | 'dm') {
  const channelMsg = await mongoRepo.getChannelMessageById(messageId);
  const dmMsg      = channelMsg ? null : await mongoRepo.getDmMessageById(messageId);
  if (!channelMsg && !dmMsg) throw Object.assign(new Error('Message not found'), { status: 404 });
  const forwarded = `↩ ${(channelMsg ?? dmMsg)!.content}`;
  if (targetType === 'channel') {
    const ch = await repo.findChannelById(targetId);
    if (!ch) throw Object.assign(new Error('Target channel not found'), { status: 404 });
    if (ch.type === 'announcement' && user.role !== 'admin' && user.role !== 'lead') {
      throw Object.assign(new Error('Only admins/leads can post in announcement channels'), { status: 403 });
    }
    if (ch.is_private) {
      const memberRole = await repo.getMemberRole(user.id, targetId);
      if (!memberRole) throw Object.assign(new Error('You are not a member of this channel'), { status: 403 });
      if (memberRole === 'readonly') throw Object.assign(new Error('You are read-only in this channel'), { status: 403 });
    }
    const authorDesignation = await repo.getEmployeeDesignation(user.id).catch(() => '');
    const id = await mongoRepo.forwardChannelMessageToChannel(user.id, user.name, authorDesignation, forwarded, targetId);
    return { id, forwarded: true };
  }
  if (user.id === targetId) throw Object.assign(new Error('Cannot forward to yourself'), { status: 400 });
  const id = await mongoRepo.forwardDmMessage(user.id, user.name, forwarded, targetId);
  return { id, forwarded: true };
}

/* ── User Presence ───────────────────────────────────────── */

export async function updatePresence(user: AuthUser, status: 'online' | 'away' | 'dnd' | 'offline') {
  await repo.upsertPresence(user.id, status);
  return { employee_id: user.id, status };
}
