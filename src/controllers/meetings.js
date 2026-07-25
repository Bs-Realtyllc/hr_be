const Meeting = require('../models/Meeting');
const meetingDto = require('../dtos/meetingDto');
const gc = require('../services/googleCalendar');

exports.list = async (req, res) => {
  try {
    const rows = await Meeting.findUpcomingScheduled();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  let data;
  try {
    data = meetingDto.toCreateInput(req.body);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }

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
    return res.status(502).json({ error: `Google Calendar: ${detail}` });
  }

  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    if (meeting.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Meeting.cancel(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
