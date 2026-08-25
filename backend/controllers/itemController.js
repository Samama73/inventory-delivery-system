const db = require('../db/database');

// Sab items list karo
function getAllItems(req, res) {
  const items = db.prepare('SELECT * FROM items ORDER BY name ASC').all();
  res.json(items);
}

// Ek item ID se lao
function getItemById(req, res) {
  const { id } = req.params;
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

  if (!item) {
    return res.status(404).json({ error: 'Item nahi mila.' });
  }
  res.json(item);
}

// Naya item add karo
function addItem(req, res) {
  const { name, item_code, color, category, description, quantity, unit, low_stock_threshold } = req.body;

  if (!name || quantity === undefined) {
    return res.status(400).json({ error: 'Name aur quantity dono chahiye.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO items (name, item_code, color, category, description, quantity, unit, low_stock_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      item_code || '',
      color || '',
      category || '',
      description || '',
      quantity,
      unit || 'pcs',
      low_stock_threshold || 5
    );

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ye item (same naam aur details ke sath) pehle se maujood hai.' });
    }
    res.status(500).json({ error: 'Kuch gadbad ho gayi.' });
  }
}

// Item update karo (quantity, naam, etc.)
function updateItem(req, res) {
  const { id } = req.params;
  const { name, item_code, color, category, description, quantity, unit, low_stock_threshold } = req.body;

  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Item nahi mila.' });
  }

  const stmt = db.prepare(`
    UPDATE items
    SET name = ?, item_code = ?, color = ?, category = ?, description = ?, quantity = ?, unit = ?, low_stock_threshold = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  stmt.run(
    name ?? existing.name,
    item_code ?? existing.item_code,
    color ?? existing.color,
    category ?? existing.category,
    description ?? existing.description,
    quantity ?? existing.quantity,
    unit ?? existing.unit,
    low_stock_threshold ?? existing.low_stock_threshold,
    id
  );

  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  res.json(updated);
}

// Item delete karo
function deleteItem(req, res) {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Item nahi mila.' });
  }

  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  res.json({ success: true, message: 'Item delete ho gaya.' });
}

module.exports = {
  getAllItems,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
};