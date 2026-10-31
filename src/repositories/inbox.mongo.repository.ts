import { Types } from 'mongoose';
import { ChannelMessage } from '../models/mongo/channelMessage';
import { DmMessage }      from '../models/mongo/dmMessage';

const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 6002}/api`;

/* ── Helpers ──────────────────────────────────────────────── */

/** Replace `__audio__:dur:objectKey` with a backend proxy URL — no CORS issues */
export async function hydrateAudioUrl(content: string): Promise<string> {
  if (!content.startsWith('__audio__:')) return content;
  const parts = content.split(':');
  if (parts.length < 3) return content;
  const dur = parts[1];
  const key = parts.slice(2).join(':');
  if (key.startsWith('http') || key.startsWith('/') || key.startsWith('blob:')) return content;
  return `__audio__:${dur}:${API_BASE}/inbox/audio/${encodeURIComponent(key)}`;
}

async function hydrateMessages<T extends { content: string }>(msgs: T[]): Promise<T[]> {
  return Promise.all(msgs.map(async m => ({
    ...m,
    content: await hydrateAudioUrl(m.content),
  })));
}

/* ── Channel Messages ─────────────────────────────────────── */

export async function insertChannelMessage(data: {
  channelId:         number;
  employeeId:        number;
  authorName:        string;
  authorDesignation: string;
  content:           string;
  replyToId?:        string;
  replyToContent?:   string;
  replyToAuthor?:    string;
}): Promise<string> {
  const doc = new ChannelMessage({
    ...data,
    replyToId:      data.replyToId ? new Types.ObjectId(data.replyToId) : null,
    replyToContent: data.replyToContent ?? null,
    replyToAuthor:  data.replyToAuthor  ?? null,
  });
  await doc.save();
  return doc._id.toString();
}

export async function listChannelMessages(channelId: number, limit = 50, before?: Date) {
  const query: any = { channelId, isDeleted: false };
  if (before) query.createdAt = { $lt: before };

  const docs = await ChannelMessage
    .find(query)
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  const mapped = docs.map(m => ({
    id:                 (m._id as Types.ObjectId).toString(),
    channel_id:         m.channelId,
    employee_id:        m.employeeId,
    author_name:        m.authorName,
    author_designation: m.authorDesignation,
    content:            m.content,
    is_edited:          m.isEdited ? 1 : 0,
    is_pinned:          m.isPinned ? 1 : 0,
    reply_to_id:        m.replyToId ? m.replyToId.toString() : null,
    reply_to_content:   m.replyToContent,
    reply_to_author:    m.replyToAuthor,
    created_at:         m.createdAt,
    updated_at:         m.updatedAt,
    reactions: (m.reactions ?? []).map(r => ({ emoji: r.emoji, users: r.employeeIds })),
  }));

  return hydrateMessages(mapped);
}

export async function getChannelMessageById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await ChannelMessage.findOne({ _id: id, isDeleted: false }).lean();
  if (!doc) return null;
  return {
    id:           (doc._id as Types.ObjectId).toString(),
    channel_id:   doc.channelId,
    employee_id:  doc.employeeId,
    author_name:  doc.authorName,
    content:      doc.content,
    is_edited:    doc.isEdited ? 1 : 0,
    is_pinned:    doc.isPinned ? 1 : 0,
  };
}

export async function getFullChannelMessageById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await ChannelMessage.findOne({ _id: id, isDeleted: false }).lean();
  if (!doc) return null;
  const content = await hydrateAudioUrl(doc.content);
  return {
    id:                 (doc._id as Types.ObjectId).toString(),
    channel_id:         doc.channelId,
    employee_id:        doc.employeeId,
    author_name:        doc.authorName,
    author_designation: doc.authorDesignation,
    content,
    is_edited:          doc.isEdited ? 1 : 0,
    is_pinned:          doc.isPinned ? 1 : 0,
    reply_to_id:        doc.replyToId ? doc.replyToId.toString() : null,
    reply_to_content:   doc.replyToContent,
    reply_to_author:    doc.replyToAuthor,
    created_at:         doc.createdAt,
    updated_at:         doc.updatedAt,
    reactions: (doc.reactions ?? []).map(r => ({ emoji: r.emoji, users: r.employeeIds })),
  };
}

export async function updateChannelMessageContent(id: string, employeeId: number, content: string) {
  if (!Types.ObjectId.isValid(id)) return;
  await ChannelMessage.updateOne(
    { _id: id, employeeId, isDeleted: false },
    { $set: { content, isEdited: true } },
  );
}

export async function softDeleteChannelMessage(id: string, employeeId: number, isAdmin: boolean) {
  if (!Types.ObjectId.isValid(id)) return;
  const filter = isAdmin ? { _id: id } : { _id: id, employeeId };
  await ChannelMessage.updateOne(filter, { $set: { isDeleted: true, deletedAt: new Date() } });
}

export async function togglePinChannelMessage(id: string, pinned: boolean) {
  if (!Types.ObjectId.isValid(id)) return;
  await ChannelMessage.updateOne({ _id: id }, { $set: { isPinned: pinned } });
}

export async function toggleReactionChannelMessage(
  messageId: string,
  employeeId: number,
  emoji: string,
): Promise<'added' | 'removed'> {
  if (!Types.ObjectId.isValid(messageId)) return 'removed';
  const doc = await ChannelMessage.findById(messageId);
  if (!doc) return 'removed';

  const existing = doc.reactions.find(r => r.emoji === emoji);
  if (existing) {
    const idx = existing.employeeIds.indexOf(employeeId);
    if (idx !== -1) {
      existing.employeeIds.splice(idx, 1);
      if (existing.employeeIds.length === 0) {
        doc.reactions = doc.reactions.filter(r => r.emoji !== emoji) as any;
      }
      await doc.save();
      return 'removed';
    }
  }

  if (!existing) {
    doc.reactions.push({ emoji, employeeIds: [employeeId] });
  } else {
    existing.employeeIds.push(employeeId);
  }
  await doc.save();
  return 'added';
}

export async function getReactionsForChannelMessage(messageId: string) {
  if (!Types.ObjectId.isValid(messageId)) return [];
  const doc = await ChannelMessage.findById(messageId).select('reactions').lean();
  return (doc?.reactions ?? []).map(r => ({ emoji: r.emoji, users: r.employeeIds }));
}

export async function getPinnedChannelMessages(channelId: number) {
  const docs = await ChannelMessage
    .find({ channelId, isPinned: true, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return docs.map(m => ({
    id:          (m._id as Types.ObjectId).toString(),
    content:     m.content,
    created_at:  m.createdAt,
    employee_id: m.employeeId,
    author_name: m.authorName,
  }));
}

export async function saveChannelMessage(employeeId: number, messageId: string) {
  if (!Types.ObjectId.isValid(messageId)) return;
  await ChannelMessage.updateOne(
    { _id: messageId, isDeleted: false },
    { $addToSet: { savedBy: employeeId } },
  );
}

export async function unsaveChannelMessage(employeeId: number, messageId: string) {
  if (!Types.ObjectId.isValid(messageId)) return;
  await ChannelMessage.updateOne(
    { _id: messageId },
    { $pull: { savedBy: employeeId } },
  );
}

export async function getSavedChannelMessages(employeeId: number) {
  const docs = await ChannelMessage
    .find({ savedBy: employeeId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return docs.map(m => ({
    id:           (m._id as Types.ObjectId).toString(),
    content:      m.content,
    created_at:   m.createdAt,
    author_name:  m.authorName,
    channel_id:   m.channelId,
    channel_name: null,
  }));
}

export async function forwardChannelMessageToChannel(
  fromEmployeeId: number,
  authorName: string,
  authorDesignation: string,
  content: string,
  targetChannelId: number,
) {
  const doc = new ChannelMessage({
    channelId: targetChannelId, employeeId: fromEmployeeId,
    authorName, authorDesignation, content,
  });
  await doc.save();
  return doc._id.toString();
}

/* ── Direct Messages ──────────────────────────────────────── */

export async function insertDmMessage(data: {
  fromEmployeeId: number;
  toEmployeeId:   number;
  content:        string;
  authorName:     string;
}): Promise<string> {
  const doc = new DmMessage(data);
  await doc.save();
  return doc._id.toString();
}

export async function listDmMessages(userId: number, partnerId: number, limit = 50, before?: Date) {
  const query: any = {
    $or: [
      { fromEmployeeId: userId,    toEmployeeId: partnerId },
      { fromEmployeeId: partnerId, toEmployeeId: userId },
    ],
    isDeleted: false,
  };
  if (before) query.createdAt = { $lt: before };

  const docs = await DmMessage
    .find(query)
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  const mapped = docs.map(m => ({
    id:               (m._id as Types.ObjectId).toString(),
    from_employee_id: m.fromEmployeeId,
    to_employee_id:   m.toEmployeeId,
    content:          m.content,
    is_edited:        m.isEdited ? 1 : 0,
    is_read:          m.isRead   ? 1 : 0,
    created_at:       m.createdAt,
    author_name:      m.authorName,
  }));

  return hydrateMessages(mapped);
}

export async function getDmMessageById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await DmMessage.findOne({ _id: id, isDeleted: false }).lean();
  if (!doc) return null;
  return {
    id:               (doc._id as Types.ObjectId).toString(),
    from_employee_id: doc.fromEmployeeId,
    to_employee_id:   doc.toEmployeeId,
    content:          doc.content,
  };
}

export async function markDmMessagesRead(fromId: number, toId: number) {
  await DmMessage.updateMany(
    { fromEmployeeId: fromId, toEmployeeId: toId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
}

export async function updateDmContent(id: string, fromId: number, content: string) {
  if (!Types.ObjectId.isValid(id)) return;
  await DmMessage.updateOne(
    { _id: id, fromEmployeeId: fromId, isDeleted: false },
    { $set: { content, isEdited: true } },
  );
}

export async function softDeleteDm(id: string, employeeId: number) {
  if (!Types.ObjectId.isValid(id)) return;
  await DmMessage.updateOne(
    { _id: id, fromEmployeeId: employeeId },
    { $set: { isDeleted: true, deletedAt: new Date() } },
  );
}

export async function listDmConversations(userId: number): Promise<any[]> {
  const [lastMsgs, unreadCounts] = await Promise.all([
    DmMessage.aggregate([
      {
        $match: {
          $or: [{ fromEmployeeId: userId }, { toEmployeeId: userId }],
          isDeleted: false,
        },
      },
      {
        $project: {
          partnerId: {
            $cond: [{ $eq: ['$fromEmployeeId', userId] }, '$toEmployeeId', '$fromEmployeeId'],
          },
          content:   '$content',
          createdAt: '$createdAt',
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id:          '$partnerId',
          last_message: { $first: '$content' },
          last_at:      { $first: '$createdAt' },
        },
      },
      { $sort: { last_at: -1 } },
      { $limit: 30 },
    ]),

    DmMessage.aggregate([
      { $match: { toEmployeeId: userId, isRead: false, isDeleted: false } },
      { $group: { _id: '$fromEmployeeId', count: { $sum: 1 } } },
    ]),
  ]);

  const unreadMap = new Map<number, number>(unreadCounts.map((u: any) => [u._id, u.count]));

  return lastMsgs.map((row: any) => ({
    partner_id:   row._id,
    last_message: row.last_message,
    last_at:      row.last_at,
    unread:       unreadMap.get(row._id) ?? 0,
  }));
}

export async function forwardDmMessage(
  fromEmployeeId: number,
  authorName: string,
  content: string,
  toEmployeeId: number,
) {
  const doc = new DmMessage({ fromEmployeeId, toEmployeeId, content, authorName });
  await doc.save();
  return doc._id.toString();
}
