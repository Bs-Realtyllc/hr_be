const db = require('../db');

exports.list = async (req, res) => {
  try {
    const { date, employee_id } = req.query;
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    let query = `
      SELECT s.*, e.name AS employee_name, e.designation, e.profile_picture
      FROM standups s JOIN employees e ON s.employee_id = e.id
      WHERE 1=1`;
    const params = [];

    if (!privileged) {
      query += ' AND s.employee_id = ?';
      params.push(req.user.id);
    } else if (employee_id) {
      query += ' AND s.employee_id = ?';
      params.push(employee_id);
    }

    if (date) { query += ' AND s.standup_date = ?'; params.push(date); }
    query += ' ORDER BY s.created_at DESC LIMIT 100';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.today = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const privileged = ['admin', 'lead'].includes(req.user?.role);

    let query = `
      SELECT s.*, e.name AS employee_name, e.designation, e.profile_picture
      FROM standups s JOIN employees e ON s.employee_id = e.id
      WHERE s.standup_date = ?`;
    const params = [today];

    if (!privileged) {
      query += ' AND s.employee_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY s.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { employee_id, yesterday, today, blockers, standup_date } = req.body;
  try {
    const date = standup_date || new Date().toISOString().split('T')[0];
    const [result] = await db.query(
      `INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE yesterday = VALUES(yesterday), today = VALUES(today), blockers = VALUES(blockers)`,
      [employee_id, yesterday, today, blockers, date]
    );

    // Fire-and-forget: mirror the standup to the Discord channel via the bot
    const botUrl   = process.env.DISCORD_BOT_URL;
    const botToken = process.env.DISCORD_INTERNAL_TOKEN;
    if (botUrl && botToken) {
      const [[employee]] = await db.query('SELECT name FROM employees WHERE id = ? LIMIT 1', [employee_id]);
      fetch(`${botUrl}/internal/standup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Token': botToken },
        body: JSON.stringify({
          employeeName: employee?.name || `Employee #${employee_id}`,
          yesterday,
          today,
          blockers,
        }),
      }).catch(err => console.error('[discord-bot] HR → Discord sync failed:', err.message));
    }

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
