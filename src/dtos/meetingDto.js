exports.toCreateInput = (body) => {
  if (!body.title || !body.start_datetime || !body.end_datetime) {
    const err = new Error('title, start_datetime, and end_datetime are required');
    err.status = 400;
    throw err;
  }
  return {
    title: body.title,
    description: body.description || null,
    start_datetime: body.start_datetime,
    end_datetime: body.end_datetime,
    attendees: body.attendees || [],
  };
};
