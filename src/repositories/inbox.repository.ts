import { eq, and, isNull, desc, asc, or, sql, inArray } from 'drizzle-orm';
import { db } from '../config/database';
import {
  inboxCategories,
  inboxChannels,
  inboxChannelMembers,
  inboxMessages,
  inboxMessageReactions,
  inboxDmMessages,
  inboxVoicePresence,
  inboxPresence,
  employees,
  designations,
} from '../models';

/* ── Categories ───────────────────────────────────────────── */

export async function listCategories() {
  return db.select().from(inboxCategories).orderBy(asc(inboxCategories.position));
}

export async function createCategory(name: string, position: number, createdBy: number) {
  const result: any = await db.insert(inboxCategories).values({ name, position, created_by: createdBy });
  return result[0].insertId as number;
}

export async function updateCategory(id: number, data: Partial<{ name: string; position: number }>) {
  await db.update(inboxCategories).set(data).where(eq(inboxCategories.id, id));
}

export async function deleteCategory(id: number) {
  await db.delete(inboxCategories).where(eq(inboxCategories.id, id));
}

/* ── Channels ─────────────────────────────────────────────── */

const ROLE_RANK: Record<string, number> = { intern: 1, employee: 2, lead: 3, admin: 4 };

export async function listChannels(employeeId?: number, employeeRole?: string) {
  /* If no employee context, return all non-archived channels */
  if (!employeeId || !employeeRole) {
    return db
      .select({
        id:            inboxChannels.id,
        name:          inboxChannels.name,
        type:          inboxChannels.type,
        category:      inboxChannels.category,
        category_id:   inboxChannels.category_id,
        category_name: inboxCategories.name,
        description:   inboxChannels.description,
        position:      inboxChannels.position,
        required_role: inboxChannels.required_role,
        is_archived:   inboxChannels.is_archived,
        is_private:    inboxChannels.is_private,
      })
      .from(inboxChannels)
      .leftJoin(inboxCategories, eq(inboxChannels.category_id, inboxCategories.id))
      .where(eq(inboxChannels.is_archived, 0))
      .orderBy(asc(inboxChannels.position));
  }

  /* Public channels where user's role meets the threshold */
  const roleRank = ROLE_RANK[employeeRole] ?? 1;
  const publicChannels = await db.execute(sql`
    SELECT
      c.id, c.name, c.type, c.category, c.category_id, cat.name AS category_name,
      c.description, c.position, c.required_role, c.is_archived, c.is_private,
      m.role AS member_role
    FROM inbox_channels c
    LEFT JOIN inbox_categories cat ON c.category_id = cat.id
    LEFT JOIN inbox_channel_members m ON m.channel_id = c.id AND m.employee_id = ${employeeId}
    WHERE c.is_archived = 0
      AND c.is_private = 0
      AND CASE c.required_role
            WHEN 'intern'   THEN 1
            WHEN 'employee' THEN 2
            WHEN 'lead'     THEN 3
            WHEN 'admin'    THEN 4
          END <= ${roleRank}
    ORDER BY c.position ASC
  `);

  /* Private channels where the user is an explicit member */
  const privateChannels = await db.execute(sql`
    SELECT
      c.id, c.name, c.type, c.category, c.category_id, cat.name AS category_name,
      c.description, c.position, c.required_role, c.is_archived, c.is_private,
      m.role AS member_role
    FROM inbox_channels c
    LEFT JOIN inbox_categories cat ON c.category_id = cat.id
    INNER JOIN inbox_channel_members m ON m.channel_id = c.id AND m.employee_id = ${employeeId}
    WHERE c.is_archived = 0 AND c.is_private = 1
    ORDER BY c.position ASC
  `);

  const pub  = ((publicChannels  as unknown as any[][])[0]) ?? [];
  const priv = ((privateChannels as unknown as any[][])[0]) ?? [];

  /* Merge, deduplicate by id */
  const seen = new Set<number>();
  const merged: any[] = [];
  for (const ch of [...pub, ...priv]) {
    if (!seen.has(ch.id)) { seen.add(ch.id); merged.push(ch); }
  }
  return merged.sort((a, b) => a.position - b.position);
}

export async function findChannelById(id: number) {
  const rows = await db.select().from(inboxChannels).where(eq(inboxChannels.id, id));
  return rows[0] ?? null;
}

export async function createChannel(data: {
  name: string;
  type: 'text' | 'voice' | 'announcement';
  category: 'text' | 'voice';
  category_id?: number;
  description?: string;
  required_role?: 'admin' | 'lead' | 'employee' | 'intern';
  is_private?: number;
  position?: number;
  created_by: number;
}) {
  const result: any = await db.insert(inboxChannels).values(data);
  const channelId = result[0].insertId as number;

  if (!data.is_private) {
    /* Auto-enrol all active employees in public channels */
    const empRows = await db.select({ id: employees.id }).from(employees)
      .where(sql`${employees.status} NOT IN ('terminated')`);
    if (empRows.length > 0) {
      await db.execute(sql`
        INSERT IGNORE INTO inbox_channel_members (channel_id, employee_id)
        VALUES ${sql.raw(empRows.map(e => `(${channelId}, ${e.id})`).join(','))}
      `);
    }
  }
  return channelId;
}

export async function updateChannel(id: number, data: {
  name?: string;
  description?: string;
  required_role?: 'admin' | 'lead' | 'employee' | 'intern';
  is_private?: number;
  category_id?: number;
}) {
  await db.update(inboxChannels).set(data).where(eq(inboxChannels.id, id));
}

export async function archiveChannel(id: number) {
  await db.update(inboxChannels).set({ is_archived: 1 }).where(eq(inboxChannels.id, id));
}

export async function deleteChannel(id: number) {
  await db.delete(inboxChannels).where(eq(inboxChannels.id, id));
}

/* ── Channel members ──────────────────────────────────────── */

export async function getMemberRole(employeeId: number, channelId: number) {
  const rows = await db
    .select({ role: inboxChannelMembers.role })
    .from(inboxChannelMembers)
    .where(and(
      eq(inboxChannelMembers.employee_id, employeeId),
      eq(inboxChannelMembers.channel_id, channelId),
    ))
    .limit(1);
  return rows[0]?.role ?? null;
}

export async function getChannelMembers(channelId: number) {
  return db
    .select({
      employee_id:  inboxChannelMembers.employee_id,
      role:         inboxChannelMembers.role,
      joined_at:    inboxChannelMembers.joined_at,
      last_read_at: inboxChannelMembers.last_read_at,
      name:         employees.name,
    })
    .from(inboxChannelMembers)
    .innerJoin(employees, eq(inboxChannelMembers.employee_id, employees.id))
    .where(eq(inboxChannelMembers.channel_id, channelId));
}

export async function setMemberRole(channelId: number, employeeId: number, role: 'admin' | 'member' | 'readonly') {
  await db.execute(sql`
    INSERT INTO inbox_channel_members (channel_id, employee_id, role)
    VALUES (${channelId}, ${employeeId}, ${role})
    ON DUPLICATE KEY UPDATE role = ${role}
  `);
}

export async function removeMember(channelId: number, employeeId: number) {
  await db.delete(inboxChannelMembers)
    .where(and(
      eq(inboxChannelMembers.channel_id, channelId),
      eq(inboxChannelMembers.employee_id, employeeId),
    ));
}

export async function markChannelRead(channelId: number, employeeId: number) {
  await db.execute(sql`
    INSERT INTO inbox_channel_members (channel_id, employee_id, last_read_at)
    VALUES (${channelId}, ${employeeId}, NOW())
    ON DUPLICATE KEY UPDATE last_read_at = NOW()
  `);
}

export async function getUnreadCountForMember(channelId: number, employeeId: number): Promise<number> {
  const rows: any[] = await db.execute(sql`
    SELECT COUNT(*) AS cnt
    FROM inbox_messages m
    WHERE m.channel_id = ${channelId}
      AND m.deleted_at IS NULL
      AND m.created_at > COALESCE(
        (SELECT last_read_at FROM inbox_channel_members WHERE channel_id = ${channelId} AND employee_id = ${employeeId}),
        '1970-01-01'
      )
  `);
  return Number((rows[0] as any[])?.[0]?.cnt ?? 0);
}

/* ── Messages ─────────────────────────────────────────────── */

export async function listMessages(channelId: number, limit = 50, before?: Date) {
  const conditions = [
    eq(inboxMessages.channel_id, channelId),
    isNull(inboxMessages.deleted_at),
  ];
  if (before) {
    conditions.push(sql`${inboxMessages.created_at} < ${before}`);
  }

  const msgs = await db
    .select({
      id:          inboxMessages.id,
      channel_id:  inboxMessages.channel_id,
      employee_id: inboxMessages.employee_id,
      content:     inboxMessages.content,
      is_edited:   inboxMessages.is_edited,
      is_pinned:   inboxMessages.is_pinned,
      reply_to_id: inboxMessages.reply_to_id,
      created_at:  inboxMessages.created_at,
      updated_at:  inboxMessages.updated_at,
      author_name:        employees.name,
      author_designation: designations.title,
    })
    .from(inboxMessages)
    .innerJoin(employees,    eq(inboxMessages.employee_id, employees.id))
    .leftJoin(designations,  eq(employees.designation_id, designations.id))
    .where(and(...conditions))
    .orderBy(asc(inboxMessages.created_at))
    .limit(limit);

  if (msgs.length === 0) return [];

  const msgIds = msgs.map(m => m.id);
  const reactions = await db
    .select({
      message_id:  inboxMessageReactions.message_id,
      emoji:       inboxMessageReactions.emoji,
      employee_id: inboxMessageReactions.employee_id,
    })
    .from(inboxMessageReactions)
    .where(inArray(inboxMessageReactions.message_id, msgIds));

  const reactionMap = new Map<number, Map<string, number[]>>();
  for (const r of reactions) {
    if (!reactionMap.has(r.message_id)) reactionMap.set(r.message_id, new Map());
    const byEmoji = reactionMap.get(r.message_id)!;
    if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, []);
    byEmoji.get(r.emoji)!.push(r.employee_id);
  }

  return msgs.map(m => ({
    ...m,
    reactions: Array.from(reactionMap.get(m.id) ?? new Map(), ([emoji, users]) => ({ emoji, users })),
  }));
}

export async function insertMessage(data: {
  channel_id:  number;
  employee_id: number;
  content:     string;
  reply_to_id?: number;
}) {
  const result: any = await db.insert(inboxMessages).values(data);
  return result[0].insertId as number;
}

export async function updateMessageContent(id: number, content: string, employeeId: number) {
  await db
    .update(inboxMessages)
    .set({ content, is_edited: 1 })
    .where(and(eq(inboxMessages.id, id), eq(inboxMessages.employee_id, employeeId)));
}

export async function softDeleteMessage(id: number, employeeId: number, isAdmin: boolean) {
  const conditions = isAdmin
    ? [eq(inboxMessages.id, id)]
    : [eq(inboxMessages.id, id), eq(inboxMessages.employee_id, employeeId)];
  await db
    .update(inboxMessages)
    .set({ deleted_at: new Date() })
    .where(and(...conditions));
}

export async function togglePin(id: number, pinned: boolean) {
  await db
    .update(inboxMessages)
    .set({ is_pinned: pinned ? 1 : 0 })
    .where(eq(inboxMessages.id, id));
}

export async function getMessageById(id: number) {
  const rows = await db
    .select()
    .from(inboxMessages)
    .where(and(eq(inboxMessages.id, id), isNull(inboxMessages.deleted_at)));
  return rows[0] ?? null;
}

export async function getFullMessageById(id: number) {
  const rows = await db
    .select({
      id:          inboxMessages.id,
      channel_id:  inboxMessages.channel_id,
      employee_id: inboxMessages.employee_id,
      content:     inboxMessages.content,
      is_edited:   inboxMessages.is_edited,
      is_pinned:   inboxMessages.is_pinned,
      reply_to_id: inboxMessages.reply_to_id,
      created_at:  inboxMessages.created_at,
      updated_at:  inboxMessages.updated_at,
      author_name:        employees.name,
      author_designation: designations.title,
    })
    .from(inboxMessages)
    .innerJoin(employees,   eq(inboxMessages.employee_id, employees.id))
    .leftJoin(designations, eq(employees.designation_id, designations.id))
    .where(and(eq(inboxMessages.id, id), isNull(inboxMessages.deleted_at)))
    .limit(1);

  if (rows.length === 0) return null;

  const reactions = await db
    .select({ emoji: inboxMessageReactions.emoji, employee_id: inboxMessageReactions.employee_id })
    .from(inboxMessageReactions)
    .where(eq(inboxMessageReactions.message_id, id));

  const reactionMap = new Map<string, number[]>();
  for (const r of reactions) {
    if (!reactionMap.has(r.emoji)) reactionMap.set(r.emoji, []);
    reactionMap.get(r.emoji)!.push(r.employee_id);
  }

  return {
    ...rows[0],
    reactions: Array.from(reactionMap, ([emoji, users]) => ({ emoji, users })),
  };
}

/* ── Reactions ────────────────────────────────────────────── */

export async function toggleReaction(messageId: number, employeeId: number, emoji: string): Promise<'added' | 'removed'> {
  const existing = await db
    .select()
    .from(inboxMessageReactions)
    .where(and(
      eq(inboxMessageReactions.message_id, messageId),
      eq(inboxMessageReactions.employee_id, employeeId),
      eq(inboxMessageReactions.emoji, emoji),
    ));

  if (existing.length > 0) {
    await db
      .delete(inboxMessageReactions)
      .where(and(
        eq(inboxMessageReactions.message_id, messageId),
        eq(inboxMessageReactions.employee_id, employeeId),
        eq(inboxMessageReactions.emoji, emoji),
      ));
    return 'removed';
  }

  await db.insert(inboxMessageReactions).values({ message_id: messageId, employee_id: employeeId, emoji });
  return 'added';
}

export async function getReactionsForMessage(messageId: number) {
  const rows = await db
    .select({
      emoji:       inboxMessageReactions.emoji,
      employee_id: inboxMessageReactions.employee_id,
    })
    .from(inboxMessageReactions)
    .where(eq(inboxMessageReactions.message_id, messageId));

  const map = new Map<string, number[]>();
  for (const r of rows) {
    if (!map.has(r.emoji)) map.set(r.emoji, []);
    map.get(r.emoji)!.push(r.employee_id);
  }
  return Array.from(map, ([emoji, users]) => ({ emoji, users }));
}

/* ── Direct Messages ──────────────────────────────────────── */

export async function listDmConversations(employeeId: number) {
  const rows: any[] = await db.execute(sql`
    SELECT
      e.id          AS partner_id,
      e.name        AS partner_name,
      d.title       AS partner_designation,
      (SELECT content FROM inbox_dm_messages m2
        WHERE (m2.from_employee_id = ${employeeId} AND m2.to_employee_id = e.id)
           OR (m2.from_employee_id = e.id AND m2.to_employee_id = ${employeeId})
        ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
      (SELECT m2.created_at FROM inbox_dm_messages m2
        WHERE (m2.from_employee_id = ${employeeId} AND m2.to_employee_id = e.id)
           OR (m2.from_employee_id = e.id AND m2.to_employee_id = ${employeeId})
        ORDER BY m2.created_at DESC LIMIT 1) AS last_at,
      (SELECT COUNT(*) FROM inbox_dm_messages m2
        WHERE m2.from_employee_id = e.id AND m2.to_employee_id = ${employeeId}
          AND m2.is_read = 0 AND m2.deleted_at IS NULL) AS unread
    FROM employees e
    LEFT JOIN designations d ON e.designation_id = d.id
    WHERE e.id != ${employeeId}
      AND e.status = 'active'
      AND EXISTS (
        SELECT 1 FROM inbox_dm_messages m3
        WHERE (m3.from_employee_id = ${employeeId} AND m3.to_employee_id = e.id)
           OR (m3.from_employee_id = e.id AND m3.to_employee_id = ${employeeId})
      )
    ORDER BY last_at DESC
    LIMIT 30
  `);
  return (rows[0] as any[]) ?? [];
}

export async function listDmMessages(employeeId: number, partnerId: number, limit = 50, before?: Date) {
  const conditions: any[] = [
    or(
      and(eq(inboxDmMessages.from_employee_id, employeeId), eq(inboxDmMessages.to_employee_id, partnerId)),
      and(eq(inboxDmMessages.from_employee_id, partnerId),   eq(inboxDmMessages.to_employee_id, employeeId)),
    )!,
    isNull(inboxDmMessages.deleted_at),
  ];
  if (before) conditions.push(sql`${inboxDmMessages.created_at} < ${before}`);

  return db
    .select({
      id:               inboxDmMessages.id,
      from_employee_id: inboxDmMessages.from_employee_id,
      to_employee_id:   inboxDmMessages.to_employee_id,
      content:          inboxDmMessages.content,
      is_edited:        inboxDmMessages.is_edited,
      is_read:          inboxDmMessages.is_read,
      created_at:       inboxDmMessages.created_at,
      author_name:      employees.name,
    })
    .from(inboxDmMessages)
    .innerJoin(employees, eq(inboxDmMessages.from_employee_id, employees.id))
    .where(and(...conditions))
    .orderBy(asc(inboxDmMessages.created_at))
    .limit(limit);
}

export async function insertDmMessage(data: {
  from_employee_id: number;
  to_employee_id:   number;
  content:          string;
}) {
  const result: any = await db.insert(inboxDmMessages).values(data);
  return result[0].insertId as number;
}

export async function markDmMessagesRead(fromId: number, toId: number) {
  await db
    .update(inboxDmMessages)
    .set({ is_read: 1 })
    .where(and(eq(inboxDmMessages.from_employee_id, fromId), eq(inboxDmMessages.to_employee_id, toId)));
}

export async function updateDmContent(id: number, fromId: number, content: string) {
  await db
    .update(inboxDmMessages)
    .set({ content, is_edited: 1 })
    .where(and(eq(inboxDmMessages.id, id), eq(inboxDmMessages.from_employee_id, fromId)));
}

export async function softDeleteDm(id: number, employeeId: number) {
  await db
    .update(inboxDmMessages)
    .set({ deleted_at: new Date() })
    .where(and(eq(inboxDmMessages.id, id), eq(inboxDmMessages.from_employee_id, employeeId)));
}

/* ── Voice Presence ──────────────────────────────────────── */

export async function joinVoiceChannel(channelId: number, employeeId: number) {
  await db.execute(sql`
    INSERT IGNORE INTO inbox_voice_presence (channel_id, employee_id) VALUES (${channelId}, ${employeeId})
  `);
}

export async function leaveVoiceChannel(channelId: number, employeeId: number) {
  await db
    .delete(inboxVoicePresence)
    .where(and(eq(inboxVoicePresence.channel_id, channelId), eq(inboxVoicePresence.employee_id, employeeId)));
}

export async function leaveAllVoiceChannels(employeeId: number) {
  await db
    .delete(inboxVoicePresence)
    .where(eq(inboxVoicePresence.employee_id, employeeId));
}

export async function getVoicePresenceByChannel(channelId: number) {
  return db
    .select({ employee_id: inboxVoicePresence.employee_id, name: employees.name })
    .from(inboxVoicePresence)
    .innerJoin(employees, eq(inboxVoicePresence.employee_id, employees.id))
    .where(eq(inboxVoicePresence.channel_id, channelId));
}

export async function getAllVoicePresence() {
  return db
    .select({
      channel_id:  inboxVoicePresence.channel_id,
      employee_id: inboxVoicePresence.employee_id,
      name:        employees.name,
    })
    .from(inboxVoicePresence)
    .innerJoin(employees, eq(inboxVoicePresence.employee_id, employees.id));
}

/* ── User Presence ───────────────────────────────────────── */

export async function upsertPresence(employeeId: number, status: 'online' | 'away' | 'dnd' | 'offline') {
  await db.execute(sql`
    INSERT INTO inbox_presence (employee_id, status) VALUES (${employeeId}, ${status})
    ON DUPLICATE KEY UPDATE status = ${status}, last_seen = NOW()
  `);
}

export async function getAllPresence(): Promise<Record<number, string>> {
  const rows = await db
    .select({ employee_id: inboxPresence.employee_id, status: inboxPresence.status })
    .from(inboxPresence);
  const map: Record<number, string> = {};
  for (const r of rows) map[r.employee_id] = r.status;
  return map;
}

export async function getPresenceForEmployees(employeeIds: number[]) {
  if (employeeIds.length === 0) return [];
  return db
    .select()
    .from(inboxPresence)
    .where(inArray(inboxPresence.employee_id, employeeIds));
}

export async function getUnreadCountsForEmployee(employeeId: number): Promise<{ channel_id: number; count: number }[]> {
  return [];
}

/* ── Pinned messages ─────────────────────────────────────── */

export async function getPinnedMessages(channelId: number) {
  const rows: any[] = await db.execute(sql`
    SELECT m.id, m.content, m.created_at, m.employee_id,
           e.name AS author_name
    FROM inbox_messages m
    INNER JOIN employees e ON m.employee_id = e.id
    WHERE m.channel_id = ${channelId}
      AND m.is_pinned = 1
      AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 50
  `);
  return (rows[0] as any[]) ?? [];
}

/* ── Saved messages ──────────────────────────────────────── */

export async function saveMessage(employeeId: number, messageId: number) {
  await db.execute(sql`
    INSERT IGNORE INTO inbox_saved_messages (employee_id, message_id, saved_at)
    VALUES (${employeeId}, ${messageId}, NOW())
  `);
}

export async function unsaveMessage(employeeId: number, messageId: number) {
  await db.execute(sql`
    DELETE FROM inbox_saved_messages
    WHERE employee_id = ${employeeId} AND message_id = ${messageId}
  `);
}

export async function getSavedMessages(employeeId: number) {
  const rows: any[] = await db.execute(sql`
    SELECT m.id, m.content, m.created_at, e.name AS author_name,
           ch.name AS channel_name
    FROM inbox_saved_messages s
    INNER JOIN inbox_messages m ON s.message_id = m.id
    INNER JOIN employees e      ON m.employee_id = e.id
    LEFT  JOIN inbox_channels ch ON m.channel_id = ch.id
    WHERE s.employee_id = ${employeeId}
      AND m.deleted_at IS NULL
    ORDER BY s.saved_at DESC
    LIMIT 100
  `);
  return (rows[0] as any[]) ?? [];
}

/* ── Employee helpers (used by inbox.service for denormalization) ── */

export async function getEmployeeDesignation(employeeId: number): Promise<string> {
  const rows: any[] = await db.execute(sql`
    SELECT d.title
    FROM employees e
    LEFT JOIN designations d ON e.designation_id = d.id
    WHERE e.id = ${employeeId}
  `);
  return ((rows[0] as any[])?.[0]?.title as string) ?? '';
}

export async function getEmployeesByIds(ids: number[]): Promise<{ id: number; name: string; designation: string }[]> {
  if (ids.length === 0) return [];
  const rows: any[] = await db.execute(sql`
    SELECT e.id, e.name, COALESCE(d.title, '') AS designation
    FROM employees e
    LEFT JOIN designations d ON e.designation_id = d.id
    WHERE e.id IN (${sql.raw(ids.join(','))})
  `);
  return (rows[0] as any[]) ?? [];
}

/* ── Forward message ─────────────────────────────────────── */

export async function forwardToChannel(fromEmployeeId: number, sourceMessageId: number, targetChannelId: number, content: string) {
  const result: any = await db.execute(sql`
    INSERT INTO inbox_messages (channel_id, employee_id, content, reply_to_id, created_at)
    VALUES (${targetChannelId}, ${fromEmployeeId}, ${content}, NULL, NOW())
  `);
  return result[0]?.insertId as number;
}

export async function forwardToDm(fromEmployeeId: number, content: string, toEmployeeId: number) {
  const result: any = await db.insert(inboxDmMessages).values({
    from_employee_id: fromEmployeeId,
    to_employee_id:   toEmployeeId,
    content,
  });
  return result[0]?.insertId as number;
}
