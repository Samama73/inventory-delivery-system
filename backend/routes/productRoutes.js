const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getAllProducts } = require('../controllers/productController');

router.use(authMiddleware);
router.get('/', getAllProducts);

module.exports = router;