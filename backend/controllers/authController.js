const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
require('dotenv').config();

function register(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username aur password dono chahiye.' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Yeh username pehle se maujood hai.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);

  res.status(201).json({ success: true, message: 'User register ho gaya.' });
}

function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username aur password dono chahiye.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Galat username ya password.' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Galat username ya password.' });
  }

  const token = jwt.sign(
    { username: user.username, id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ success: true, token });
}

module.exports = { login, register };