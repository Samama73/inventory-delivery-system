const db = require('../db/database');

const VALID_TYPES = ['pending_items', 'complaint'];

// GET /api/followups?type=pending_items|complaint
function getFollowups(req, res) {
  const { type } = req.query;
  let rows;
  if (type) {
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type galat hai.' });
    }
    rows = db.prepare('SELECT * FROM followups WHERE type = ? ORDER BY created_at DESC, id DESC').all(type);
  } else {
    rows = db.prepare('SELECT * FROM followups ORDER BY created_at DESC, id DESC').all();
  }
  res.json(rows);
}

// POST /api/followups
function addFollowup(req, res) {
  const { type, customer_name, phone_number, details } = req.body;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Type galat hai.' });
  }
  if (!customer_name || !customer_name.trim()) {
    return res.status(400).json({ error: 'Customer ka naam zaroori hai.' });
  }
  if (!details || !details.trim()) {
    return res.status(400).json({ error: 'Details zaroori hain.' });
  }

  const result = db.prepare(
    'INSERT INTO followups (type, customer_name, phone_number, details) VALUES (?, ?, ?, ?)'
  ).run(type, customer_name.trim(), (phone_number || '').trim(), details.trim());

  res.status(201).json(db.prepare('SELECT * FROM followups WHERE id = ?').get(result.lastInsertRowid));
}

// PATCH /api/followups/:id  (jo fields bheji jaayein sirf wahi update hongi)
function updateFollowup(req, res) {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM followups WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Record nahi mila.' });
  }

  const { customer_name, phone_number, details, resolved } = req.body;

  const newName = customer_name !== undefined ? String(customer_name).trim() : existing.customer_name;
  const newDetails = details !== undefined ? String(details).trim() : existing.details;
  if (!newName) return res.status(400).json({ error: 'Customer ka naam zaroori hai.' });
  if (!newDetails) return res.status(400).json({ error: 'Details zaroori hain.' });

  const newPhone = phone_number !== undefined ? String(phone_number).trim() : existing.phone_number;
  const newResolved = resolved !== undefined ? (resolved ? 1 : 0) : existing.resolved;

  db.prepare(`
    UPDATE followups
    SET customer_name = ?, phone_number = ?, details = ?, resolved = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(newName, newPhone, newDetails, newResolved, id);

  res.json(db.prepare('SELECT * FROM followups WHERE id = ?').get(id));
}

// DELETE /api/followups/:id
function deleteFollowup(req, res) {
  const result = db.prepare('DELETE FROM followups WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Record nahi mila.' });
  }
  res.json({ success: true });
}

module.exports = { getFollowups, addFollowup, updateFollowup, deleteFollowup };