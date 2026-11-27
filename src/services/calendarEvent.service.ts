import * as calendarEventRepo from '../repositories/calendarEvent.repository';
import AppError from '../pkg/AppError';
import type { CalendarEventInput, CalendarEventRange } from '../dtos/calendarEvent.dto';

// Who may write is decided in the routes (admin only, like holidays), so the
// service only checks that the event exists.

export async function list(range: CalendarEventRange) {
  return calendarEventRepo.findInRange(range);
}

export async function getById(id: string) {
  const event = await calendarEventRepo.findById(id);
  if (!event) throw new AppError('Event not found', 404);
  return event;
}

/** Returns the saved row (with creator_name), the same shape as the list. */
export async function create(data: CalendarEventInput, actorId: number) {
  const id = await calendarEventRepo.create(data, actorId);
  return getById(String(id));
}

export async function update(id: string, data: CalendarEventInput, actorId: number) {
  await getById(id);
  await calendarEventRepo.update(id, data, actorId);
  return getById(id);
}

export async function remove(id: string) {
  await getById(id);
  await calendarEventRepo.remove(id);
}
