import type { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import * as repo from '../repositories/inbox.repository';
import * as inboxService from '../services/inbox.service';

interface AuthPayload { id: number; name: string; role: string; }

/* Typing state: channelId → Set<userName> */
const typingState  = new Map<string, Set<string>>();
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

/*
 * Multi-socket presence tracking.
 * A single user can have multiple open tabs / Capacitor instances.
 * We only mark them offline when their LAST socket disconnects.
 */
const onlineSockets = new Map<number, Set<string>>();

/* Heartbeat timeout per socket (90 s without ping → away) */
const heartbeatTimers = new Map<string, ReturnType<typeof setTimeout>>();

const HEARTBEAT_TIMEOUT_MS = 90_000;

function getTypingKey(channelId: string, userId: number) {
  return `${channelId}:${userId}`;
}

function resetHeartbeat(socketId: string, userId: number, io: SocketServer) {
  if (heartbeatTimers.has(socketId)) clearTimeout(heartbeatTimers.get(socketId)!);
  heartbeatTimers.set(socketId, setTimeout(async () => {
    /* No ping in 90 s — downgrade to away */
    await repo.upsertPresence(userId, 'away').catch(() => {});
    io.emit('presence:update', { employee_id: userId, status: 'away' });
  }, HEARTBEAT_TIMEOUT_MS));
}

export function attachInboxSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:6001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/ws/inbox',
  });

  /* ── Auth middleware ─────────────────────────────────────── */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  /* ── Connection ──────────────────────────────────────────── */
  io.on('connection', async (socket: Socket) => {
    const user: AuthPayload = (socket as any).user;

    /* Put the socket in a personal room for targeted DM notifications */
    socket.join(`user:${user.id}`);

    /* Track this socket for multi-tab presence */
    if (!onlineSockets.has(user.id)) onlineSockets.set(user.id, new Set());
    onlineSockets.get(user.id)!.add(socket.id);

    /* Mark user as online & start heartbeat watcher */
    await repo.upsertPresence(user.id, 'online').catch(() => {});
    io.emit('presence:update', { employee_id: user.id, status: 'online' });
    resetHeartbeat(socket.id, user.id, io);

    /* Send current presence snapshot to the newly connected client only */
    repo.getAllPresence()
      .then(snapshot => socket.emit('presence:snapshot', snapshot))
      .catch(() => {});

    /* ── Heartbeat ───────────────────────────────────────────── */
    socket.on('ping', () => {
      socket.emit('pong');
      resetHeartbeat(socket.id, user.id, io);
      /* If user was downgraded to away, bring them back */
      repo.upsertPresence(user.id, 'online').catch(() => {});
    });

    /* ── join-channel ────────────────────────────────────────── */
    socket.on('join-channel', async (channelId: string) => {
      try {
        const ch = await repo.findChannelById(Number(channelId));
        if (!ch) return;
        if (ch.is_private) {
          const role = await repo.getMemberRole(user.id, Number(channelId));
          if (!role) return; // not a member — silently refuse
        }
        socket.join(`channel:${channelId}`);
      } catch {
        // ignore
      }
    });

    socket.on('leave-channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    /* ── message:send ────────────────────────────────────────── */
    socket.on('message:send', async (data: { channelId: number; content: string; replyToId?: number }) => {
      try {
        /* Enforce per-member write permissions for private channels */
        const memberRole = await repo.getMemberRole(user.id, data.channelId);
        if (memberRole === 'readonly') {
          socket.emit('error', { code: 403, message: 'You are read-only in this channel' });
          return;
        }
        const msg = await inboxService.sendMessage(user, data.channelId, data.content, data.replyToId);
        io.to(`channel:${data.channelId}`).emit('message:new', msg);
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── message:edit ────────────────────────────────────────── */
    socket.on('message:edit', async (data: { messageId: number; content: string; channelId: number }) => {
      try {
        const result = await inboxService.editMessage(user, data.messageId, data.content);
        io.to(`channel:${data.channelId}`).emit('message:edited', result);
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── message:delete ──────────────────────────────────────── */
    socket.on('message:delete', async (data: { messageId: number; channelId: number }) => {
      try {
        await inboxService.deleteMessage(user, data.messageId);
        io.to(`channel:${data.channelId}`).emit('message:deleted', { id: data.messageId });
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── reaction:toggle ─────────────────────────────────────── */
    socket.on('reaction:toggle', async (data: { messageId: number; emoji: string; channelId: number }) => {
      try {
        const result = await inboxService.toggleReaction(user, data.messageId, data.emoji);
        io.to(`channel:${data.channelId}`).emit('reaction:updated', result);
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── typing ──────────────────────────────────────────────── */
    socket.on('typing:start', (channelId: string) => {
      const key = getTypingKey(channelId, user.id);

      if (!typingState.has(channelId)) typingState.set(channelId, new Set());
      typingState.get(channelId)!.add(user.name);
      io.to(`channel:${channelId}`).emit('typing:update', {
        channelId,
        users: Array.from(typingState.get(channelId)!),
      });

      if (typingTimers.has(key)) clearTimeout(typingTimers.get(key)!);
      typingTimers.set(key, setTimeout(() => {
        typingState.get(channelId)?.delete(user.name);
        io.to(`channel:${channelId}`).emit('typing:update', {
          channelId,
          users: Array.from(typingState.get(channelId) ?? []),
        });
        typingTimers.delete(key);
      }, 5000));
    });

    socket.on('typing:stop', (channelId: string) => {
      const key = getTypingKey(channelId, user.id);
      typingState.get(channelId)?.delete(user.name);
      io.to(`channel:${channelId}`).emit('typing:update', {
        channelId,
        users: Array.from(typingState.get(channelId) ?? []),
      });
      if (typingTimers.has(key)) { clearTimeout(typingTimers.get(key)!); typingTimers.delete(key); }
    });

    /* ── DMs ─────────────────────────────────────────────────── */
    socket.on('dm:send', async (data: { toUserId: number; content: string }) => {
      try {
        const result = await inboxService.sendDm(user, data.toUserId, data.content);
        const payload = {
          id: result.id,
          from: user.id,
          from_name: user.name,
          to: data.toUserId,
          content: data.content,
          created_at: new Date().toISOString(),
        };
        io.to(`user:${data.toUserId}`).emit('dm:new', payload);
        socket.emit('dm:sent', { localTs: data.content, id: result.id });
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── dm:edit ─────────────────────────────────────────────── */
    socket.on('dm:edit', async (data: { messageId: number; content: string }) => {
      try {
        const result = await inboxService.editDm(user, data.messageId, data.content);
        /* Notify the sender's other tabs */
        socket.emit('dm:edited', result);
        /* We'd need the partner id to notify the recipient — look it up */
        /* For now emit to the sender's own user room so other tabs update */
        io.to(`user:${user.id}`).emit('dm:edited', result);
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── dm:delete ───────────────────────────────────────────── */
    socket.on('dm:delete', async (data: { messageId: number }) => {
      try {
        await inboxService.deleteDm(user, data.messageId);
        socket.emit('dm:deleted', { id: data.messageId });
        io.to(`user:${user.id}`).emit('dm:deleted', { id: data.messageId });
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── Voice ───────────────────────────────────────────────── */
    socket.on('voice:join', async (channelId: number) => {
      try {
        const occupants = await inboxService.joinVoice(user, channelId);
        socket.join(`voice:${channelId}`);
        io.emit(`voice:presence:${channelId}`, occupants);
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    socket.on('voice:leave', async (channelId: number) => {
      try {
        const occupants = await inboxService.leaveVoice(user, channelId);
        socket.leave(`voice:${channelId}`);
        io.emit(`voice:presence:${channelId}`, occupants);
      } catch (err: any) {
        socket.emit('error', { code: err.status ?? 500, message: err.message });
      }
    });

    /* ── Presence (manual status change) ────────────────────── */
    socket.on('presence:set', async (status: unknown) => {
      if (!['online', 'away', 'dnd', 'offline'].includes(status as string)) return;
      const s = status as 'online' | 'away' | 'dnd' | 'offline';
      await repo.upsertPresence(user.id, s).catch(() => {});
      io.emit('presence:update', { employee_id: user.id, status: s });
    });

    /* ── Disconnect ──────────────────────────────────────────── */
    socket.on('disconnect', async () => {
      /* Clear heartbeat timer */
      if (heartbeatTimers.has(socket.id)) {
        clearTimeout(heartbeatTimers.get(socket.id)!);
        heartbeatTimers.delete(socket.id);
      }

      /* Remove this socket from the user's set */
      const sockets = onlineSockets.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          /* Last tab/device disconnected — mark offline */
          onlineSockets.delete(user.id);
          await repo.upsertPresence(user.id, 'offline').catch(() => {});
          await repo.leaveAllVoiceChannels(user.id).catch(() => {});
          io.emit('presence:update', { employee_id: user.id, status: 'offline' });
        }
        /* else: user still has other sockets open — stay online */
      }

      /* Clear typing for all channels */
      typingState.forEach((users, channelId) => {
        if (users.has(user.name)) {
          users.delete(user.name);
          io.to(`channel:${channelId}`).emit('typing:update', { channelId, users: Array.from(users) });
        }
      });
    });
  });

  return io;
}
