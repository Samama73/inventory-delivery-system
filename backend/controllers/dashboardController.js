const db = require('../db/database');

function getDashboardSummary(req, res) {
  const totalItems = db.prepare('SELECT COUNT(*) as count FROM items').get().count;

  const lowStockItems = db.prepare(
    'SELECT COUNT(*) as count FROM items WHERE quantity <= low_stock_threshold'
  ).get().count;

  const pendingDeliveries = db.prepare(
    "SELECT COUNT(*) as count FROM deliveries WHERE status = 'pending'"
  ).get().count;

  const completedDeliveries = db.prepare(
    "SELECT COUNT(*) as count FROM deliveries WHERE status = 'completed'"
  ).get().count;

  // Recent 5 pending deliveries bhi bhej do dashboard pe dikhane ke liye
  const recentPending = db.prepare(
    "SELECT * FROM deliveries WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5"
  ).all();

  res.json({
    totalItems,
    lowStockItems,
    pendingDeliveries,
    completedDeliveries,
    recentPending,
  });
}

function getDaySummary(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date zaroori hai.' });
  }

  const deliveries = db.prepare(`
    SELECT * FROM deliveries WHERE delivery_date = ? ORDER BY created_at DESC
  `).all(date);

  const completed = deliveries.filter((d) => d.status === 'completed').length;
  const pending = deliveries.filter((d) => d.status === 'pending').length;

  res.json({
    date,
    totalDeliveries: deliveries.length,
    completed,
    pending,
    deliveries,
  });
}

module.exports = { getDashboardSummary, getDaySummary };
