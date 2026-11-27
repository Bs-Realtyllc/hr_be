import * as meetingRepo from '../repositories/meeting.repository';
import AppError from '../pkg/AppError';
import { fromDbUtc } from '../pkg/instant';
import type { MeetingCreateInput, MeetingRange } from '../dtos/meeting.dto';
const gc = require('../services/googleCalendar');

interface AuthUser {
  id: number;
  role: string;
}

/** With a range: scheduled meetings in it. Without: from 7 days ago on (the old calendar page). */
export async function list(range: MeetingRange) {
  if (!range.from && !range.to) return meetingRepo.findUpcomingScheduled();
  return meetingRepo.findScheduledInRange(range);
}

function googleError(err: any) {
  const detail = err?.response?.data?.error?.message || err.message;
  console.error('[meetings] Google Calendar error:', detail);
  return new AppError(`Google Calendar: ${detail}`, 502);
}

/** A scheduled meeting that `user` may change: its creator or an admin. */
async function findEditable(id: string, user: AuthUser) {
  const meeting: any = await meetingRepo.findById(id);
  if (!meeting || meeting.status !== 'scheduled') throw new AppError('Meeting not found', 404);
  if (meeting.created_by !== user.id && user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }
  return meeting;
}

export async function create(data: MeetingCreateInput, actorId: number) {
  let googleEventId: string | null = null;
  let meetLink: string | null = null;

  try {
    const result = await gc.createMeetingEvent({
      title: data.title,
      description: data.description,
      startDateTime: fromDbUtc(data.start_datetime),
      endDateTime: fromDbUtc(data.end_datetime),
      attendees: data.attendees,
      timeZone: data.time_zone,
    });
    googleEventId = result.googleEventId;
    meetLink = result.meetLink;
  } catch (err: any) {
    throw googleError(err);
  }

  const id = await meetingRepo.create({
    ...data,
    google_event_id: googleEventId,
    meet_link: meetLink,
    created_by: actorId,
  });

  // The saved row, the same shape as the list
  return meetingRepo.findById(id);
}

/** Edits the meeting and its Google Calendar event (Google first, so a failure changes nothing). */
export async function update(id: string, data: MeetingCreateInput, user: AuthUser) {
  const meeting = await findEditable(id, user);

  if (meeting.google_event_id) {
    try {
      await gc.updateMeetingEvent(meeting.google_event_id, {
        title: data.title,
        description: data.description,
        startDateTime: fromDbUtc(data.start_datetime),
        endDateTime: fromDbUtc(data.end_datetime),
        attendees: data.attendees,
        timeZone: data.time_zone,
      });
    } catch (err: any) {
      throw googleError(err);
    }
  }

  await meetingRepo.update(id, data, user.id);
  return meetingRepo.findById(id);
}

/** Cancels the meeting and deletes its Google Calendar event (Google first, so a failure changes nothing). */
export async function remove(id: string, user: AuthUser) {
  const meeting = await findEditable(id, user);

  if (meeting.google_event_id) {
    try {
      await gc.deleteMeetingEvent(meeting.google_event_id);
    } catch (err: any) {
      throw googleError(err);
    }
  }

  await meetingRepo.cancel(id, user.id);
}
