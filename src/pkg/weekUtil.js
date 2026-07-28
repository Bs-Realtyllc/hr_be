// Returns the Monday of the week containing `date`, at midnight, formatted as YYYY-MM-DD.
// This is the single source of truth for both the upload folder name and the DB column,
// so a submission always lands in the folder matching its own week_start_date.
function getWeekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

module.exports = { getWeekStartDate };
