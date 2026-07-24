const db = require('../db/database');
const products = require('../data/products');
const crypto = require('crypto');

// Sab deliveries list karo (optional status filter ke saath)
function getAllDeliveries(req, res) {
  const { status } = req.query;

  let deliveries;
  if (status) {
    deliveries = db.prepare(`
      SELECT d.*, i.description AS item_description
      FROM deliveries d
      LEFT JOIN items i ON i.name = d.item_name
      WHERE d.status = ?
      ORDER BY d.created_at DESC
    `).all(status);
  } else {
    deliveries = db.prepare(`
      SELECT d.*, i.description AS item_description
      FROM deliveries d
      LEFT JOIN items i ON i.name = d.item_name
      ORDER BY d.created_at DESC
    `).all();
  }

  res.json(deliveries);
}

function getDeliveryById(req, res) {
  const { id } = req.params;
  const delivery = db.prepare(`
    SELECT d.*, i.description AS item_description
    FROM deliveries d
    LEFT JOIN items i ON i.name = d.item_name
    WHERE d.id = ?
  `).get(id);

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery nahi mili.' });
  }
  res.json(delivery);
}

// Nayi delivery add karo (single item — purana route, backward compatibility ke liye rakha hai)
function addDelivery(req, res) {
  const { item_name, quantity, customer_name, phone_number, address, delivery_date, remarks, description } = req.body;

  if (!item_name || !quantity || !customer_name) {
    return res.status(400).json({ error: 'Item name, quantity aur customer name zaroori hai.' });
  }

  const qty = Number(quantity);

  const item = db.prepare('SELECT * FROM items WHERE name = ?').get(item_name);
  if (!item) {
    return res.status(404).json({ error: 'Ye item inventory mein maujood nahi hai.' });
  }
  if (item.quantity < qty) {
    return res.status(400).json({
      error: `Sirf ${item.quantity} ${item.unit} stock mein hai. Itni quantity available nahi hai.`,
    });
  }

  const product = products.find((p) => p.name === item_name);
  const unitPrice = product ? product.price : 0;
  const totalAmount = unitPrice * qty;

  const runTransaction = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO deliveries (item_name, quantity, customer_name, phone_number, address, delivery_date, status, unit_price, total_amount, remarks, description)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `);
    const result = stmt.run(
      item_name, qty, customer_name, phone_number || '', address || '',
      delivery_date || null, unitPrice, totalAmount, remarks || '', description || ''
    );

    db.prepare(`
      UPDATE items SET quantity = quantity - ?, updated_at = datetime('now', 'localtime') WHERE id = ?
    `).run(qty, item.id);

    return result.lastInsertRowid;
  });

  try {
    const newId = runTransaction();
    const newDelivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(newId);
    res.status(201).json(newDelivery);
  } catch (err) {
    res.status(500).json({ error: 'Delivery add karte waqt kuch gadbad ho gayi.' });
  }
}

// Delivery status update karo (pending <-> completed) — single item
function updateDeliveryStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'completed'].includes(status)) {
    return res.status(400).json({ error: "Status sirf 'pending' ya 'completed' ho sakta hai." });
  }

  const existing = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Delivery nahi mili.' });
  }

  db.prepare(`
    UPDATE deliveries
    SET status = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(status, id);

  const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
  res.json(updated);
}

// Delivery ki poori details update karo (single item)
function updateDelivery(req, res) {
  const { id } = req.params;
  const { item_name, quantity, customer_name, phone_number, address, delivery_date, remarks, description } = req.body;

  const existing = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Delivery nahi mili.' });
  }

  const newItemName = item_name ?? existing.item_name;
  const newQuantity = Number(quantity ?? existing.quantity);

  const runTransaction = db.transaction(() => {
    db.prepare(`
      UPDATE items SET quantity = quantity + ?, updated_at = datetime('now', 'localtime')
      WHERE name = ?
    `).run(existing.quantity, existing.item_name);

    const targetItem = db.prepare('SELECT * FROM items WHERE name = ?').get(newItemName);
    if (!targetItem) {
      throw new Error('ITEM_NOT_FOUND');
    }
    if (targetItem.quantity < newQuantity) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    db.prepare(`
      UPDATE items SET quantity = quantity - ?, updated_at = datetime('now', 'localtime')
      WHERE name = ?
    `).run(newQuantity, newItemName);

    const product = products.find((p) => p.name === newItemName);
    const unitPrice = product ? product.price : existing.unit_price;
    const totalAmount = unitPrice * newQuantity;

    db.prepare(`
      UPDATE deliveries
      SET item_name = ?, quantity = ?, customer_name = ?, phone_number = ?, address = ?, delivery_date = ?,
          unit_price = ?, total_amount = ?, remarks = ?, description = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      newItemName,
      newQuantity,
      customer_name ?? existing.customer_name,
      phone_number ?? existing.phone_number,
      address ?? existing.address,
      delivery_date ?? existing.delivery_date,
      unitPrice,
      totalAmount,
      remarks ?? existing.remarks,
      description ?? existing.description,
      id
    );
  });

  try {
    runTransaction();
    const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err.message === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ error: 'Ye item inventory mein maujood nahi hai.' });
    }
    if (err.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: 'Itni quantity available nahi hai stock mein.' });
    }
    res.status(500).json({ error: 'Delivery update karte waqt kuch gadbad ho gayi.' });
  }
}

// Delivery delete karo (single item)
function deleteDelivery(req, res) {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Delivery nahi mili.' });
  }

  const runTransaction = db.transaction(() => {
    db.prepare('DELETE FROM deliveries WHERE id = ?').run(id);

    db.prepare(`
      UPDATE items
      SET quantity = quantity + ?, updated_at = datetime('now', 'localtime')
      WHERE name = ?
    `).run(existing.quantity, existing.item_name);
  });

  runTransaction();
  res.json({ success: true, message: 'Delivery delete ho gayi aur stock wapas add ho gaya.' });
}

// ---------- Group (Multi-item Order) Functions ----------

// Naya order banao (multiple items ek order_id ke saath)
function addDeliveryGroup(req, res) {
  const { customer_name, phone_number, address, delivery_date, remarks, items: orderLines } = req.body;

  if (!customer_name || !Array.isArray(orderLines) || orderLines.length === 0) {
    return res.status(400).json({ error: 'Customer name aur kam se kam ek item chahiye.' });
  }

  const orderId = crypto.randomUUID();

  const runTransaction = db.transaction(() => {
    for (const line of orderLines) {
      const qty = Number(line.quantity);
      const item = db.prepare('SELECT * FROM items WHERE name = ?').get(line.item_name);
      if (!item) throw new Error(`ITEM_NOT_FOUND:${line.item_name}`);
      if (item.quantity < qty) throw new Error(`INSUFFICIENT_STOCK:${line.item_name}`);

      const product = products.find((p) => p.name === line.item_name);
      const unitPrice = product ? product.price : 0;
      const totalAmount = unitPrice * qty;

      db.prepare(`
        INSERT INTO deliveries (item_name, quantity, customer_name, phone_number, address, delivery_date, status, unit_price, total_amount, remarks, description, order_id)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
      `).run(line.item_name, qty, customer_name, phone_number || '', address || '', delivery_date || null, unitPrice, totalAmount, remarks || '', line.description || '', orderId);

      db.prepare(`
        UPDATE items SET quantity = quantity - ?, updated_at = datetime('now', 'localtime') WHERE id = ?
      `).run(qty, item.id);
    }
  });

  try {
    runTransaction();
    const created = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').all(orderId);
    res.status(201).json(created);
  } catch (err) {
    console.error('addDeliveryGroup error:', err.message);
    const [type, name] = err.message.split(':');
    if (type === 'ITEM_NOT_FOUND') return res.status(404).json({ error: `${name} inventory mein maujood nahi hai.` });
    if (type === 'INSUFFICIENT_STOCK') return res.status(400).json({ error: `${name} ka stock kam hai.` });
    res.status(500).json({ error: 'Order add karte waqt gadbad ho gayi.' });
  }
}

// Ek order ki sab items lao
function getDeliveryGroup(req, res) {
  const { order_id } = req.params;
  const rows = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').all(order_id);
  if (rows.length === 0) return res.status(404).json({ error: 'Order nahi mila.' });
  res.json(rows);
}

// Order update karo (purane items ka stock wapas, naye items ka stock minus)
function updateDeliveryGroup(req, res) {
  const { order_id } = req.params;
  const { customer_name, phone_number, address, delivery_date, remarks, items: orderLines } = req.body;

  const existingRows = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').all(order_id);
  if (existingRows.length === 0) {
    return res.status(404).json({ error: 'Order nahi mila.' });
  }

  const runTransaction = db.transaction(() => {
    for (const row of existingRows) {
      db.prepare(`UPDATE items SET quantity = quantity + ?, updated_at = datetime('now', 'localtime') WHERE name = ?`)
        .run(row.quantity, row.item_name);
    }

    db.prepare('DELETE FROM deliveries WHERE order_id = ?').run(order_id);

    for (const line of orderLines) {
      const qty = Number(line.quantity);
      const item = db.prepare('SELECT * FROM items WHERE name = ?').get(line.item_name);
      if (!item) throw new Error(`ITEM_NOT_FOUND:${line.item_name}`);
      if (item.quantity < qty) throw new Error(`INSUFFICIENT_STOCK:${line.item_name}`);

      const product = products.find((p) => p.name === line.item_name);
      const unitPrice = product ? product.price : 0;
      const totalAmount = unitPrice * qty;

      db.prepare(`
        INSERT INTO deliveries (item_name, quantity, customer_name, phone_number, address, delivery_date, status, unit_price, total_amount, remarks, description, order_id)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
      `).run(line.item_name, qty, customer_name, phone_number || '', address || '', delivery_date || null, unitPrice, totalAmount, remarks || '', line.description || '', order_id);

      db.prepare(`UPDATE items SET quantity = quantity - ?, updated_at = datetime('now', 'localtime') WHERE id = ?`)
        .run(qty, item.id);
    }
  });

  try {
    runTransaction();
    const updated = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').all(order_id);
    res.json(updated);
  } catch (err) {
    console.error('updateDeliveryGroup error:', err.message);
    const [type, name] = err.message.split(':');
    if (type === 'ITEM_NOT_FOUND') return res.status(404).json({ error: `${name} inventory mein maujood nahi hai.` });
    if (type === 'INSUFFICIENT_STOCK') return res.status(400).json({ error: `${name} ka stock kam hai.` });
    res.status(500).json({ error: 'Order update karte waqt gadbad ho gayi.' });
  }
}

// Order delete karo (sab items ka stock wapas)
function deleteDeliveryGroup(req, res) {
  const { order_id } = req.params;
  const existingRows = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').all(order_id);
  if (existingRows.length === 0) {
    return res.status(404).json({ error: 'Order nahi mila.' });
  }

  const runTransaction = db.transaction(() => {
    db.prepare('DELETE FROM deliveries WHERE order_id = ?').run(order_id);
    for (const row of existingRows) {
      db.prepare(`UPDATE items SET quantity = quantity + ?, updated_at = datetime('now', 'localtime') WHERE name = ?`)
        .run(row.quantity, row.item_name);
    }
  });

  runTransaction();
  res.json({ success: true, message: 'Order delete ho gaya aur stock wapas add ho gaya.' });
}

// Poore order ka status update karo (sab items ek saath)
function updateDeliveryGroupStatus(req, res) {
  const { order_id } = req.params;
  const { status } = req.body;

  if (!['pending', 'completed'].includes(status)) {
    return res.status(400).json({ error: "Status sirf 'pending' ya 'completed' ho sakta hai." });
  }

  const existingRows = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').all(order_id);
  if (existingRows.length === 0) {
    return res.status(404).json({ error: 'Order nahi mila.' });
  }

  db.prepare(`UPDATE deliveries SET status = ?, updated_at = datetime('now', 'localtime') WHERE order_id = ?`)
    .run(status, order_id);

  const updated = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').all(order_id);
  res.json(updated);
}

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  addDelivery,
  updateDeliveryStatus,
  updateDelivery,
  deleteDelivery,
  addDeliveryGroup,
  getDeliveryGroup,
  updateDeliveryGroup,
  deleteDeliveryGroup,
  updateDeliveryGroupStatus,
};