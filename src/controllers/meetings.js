const Meeting = require('../models/Meeting');
const meetingDto = require('../dtos/meetingDto');
const gc = require('../services/googleCalendar');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const rows = await Meeting.findUpcomingScheduled();
  res.json(rows);
});

exports.create = asyncHandler(async (req, res) => {
  const data = meetingDto.toCreateInput(req.body);

  let googleEventId = null;
  let meetLink = null;

  try {
    const result = await gc.createMeetingEvent({
      title: data.title,
      description: data.description,
      startDateTime: data.start_datetime,
      endDateTime: data.end_datetime,
      attendees: data.attendees,
    });
    googleEventId = result.googleEventId;
    meetLink      = result.meetLink;
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message;
    console.error('[meetings] Google Calendar error:', detail);
    throw new AppError(`Google Calendar: ${detail}`, 502);
  }

  const id = await Meeting.create({
    ...data,
    google_event_id: googleEventId,
    meet_link: meetLink,
    created_by: req.user.id,
  });
  res.status(201).json({
    id,
    title: data.title,
    start_datetime: data.start_datetime,
    end_datetime: data.end_datetime,
    meetLink,
    googleEventId,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meeting = await Meeting.findById(id);
  if (!meeting) throw new AppError('Meeting not found', 404);
  if (meeting.created_by !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  await Meeting.cancel(id);
  res.json({ success: true });
});
