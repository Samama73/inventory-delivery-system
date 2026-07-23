const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllItems,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');

// Sab routes protected hain (login zaroori hai)
router.use(authMiddleware);

router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', addItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;