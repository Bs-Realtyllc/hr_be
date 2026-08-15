const Employee = require('../models/Employee');
const CultureEvent = require('../models/CultureEvent');

// Called when an employee sets/changes their date of birth (see profile.js) —
// keeps their yearly birthday entry on the culture-events calendar in sync.
exports.upsertBirthdayEvent = async (employeeId, dob) => {
  const d     = new Date(dob);
  const year  = new Date().getFullYear();
  const mm    = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd    = String(d.getUTCDate()).padStart(2, '0');
  const date  = `${year}-${mm}-${dd}`;

  const emp   = await Employee.findNameById(employeeId);
  const title = `${emp.name}'s Birthday`;

  const existing = await CultureEvent.findBirthdayByEmployeeId(employeeId);

  if (existing) {
    await CultureEvent.updateDateAndTitle(existing.id, date, title);
  } else {
    await CultureEvent.createBirthday(employeeId, date, title, `Happy Birthday ${emp.name}! 🎉`);
  }
};
