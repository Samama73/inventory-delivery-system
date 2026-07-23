const jwt = require('jsonwebtoken');
require('dotenv').config();

function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username aur password dono chahiye.' });
  }

  // .env se compare karo (single user, simple check)
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 din tak valid rahega token
    );

    return res.json({ success: true, token });
  }

  return res.status(401).json({ error: 'Galat username ya password.' });
}

module.exports = { login };