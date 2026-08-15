import * as meetingRepo from '../repositories/meeting.repository';
import AppError from '../pkg/AppError';
import type { MeetingCreateInput } from '../dtos/meeting.dto';
const gc = require('../services/googleCalendar');

interface AuthUser {
  id: number;
  role: string;
}

export async function list() {
  return meetingRepo.findUpcomingScheduled();
}

export async function create(data: MeetingCreateInput, actorId: number) {
  let googleEventId: string | null = null;
  let meetLink: string | null = null;

  try {
    const result = await gc.createMeetingEvent({
      title: data.title,
      description: data.description,
      startDateTime: data.start_datetime,
      endDateTime: data.end_datetime,
      attendees: data.attendees,
    });
    googleEventId = result.googleEventId;
    meetLink = result.meetLink;
  } catch (err: any) {
    const detail = err?.response?.data?.error?.message || err.message;
    console.error('[meetings] Google Calendar error:', detail);
    throw new AppError(`Google Calendar: ${detail}`, 502);
  }

  const id = await meetingRepo.create({
    ...data,
    google_event_id: googleEventId,
    meet_link: meetLink,
    created_by: actorId,
  });

  return { id, title: data.title, start_datetime: data.start_datetime, end_datetime: data.end_datetime, meetLink, googleEventId };
}

export async function remove(id: string, user: AuthUser) {
  const meeting: any = await meetingRepo.findById(id);
  if (!meeting) throw new AppError('Meeting not found', 404);
  if (meeting.created_by !== user.id && user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  await meetingRepo.cancel(id, user.id);
}
