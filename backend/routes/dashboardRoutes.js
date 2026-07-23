const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getDashboardSummary, getDaySummary } = require('../controllers/dashboardController');

router.use(authMiddleware);
router.get('/summary', getDashboardSummary);
router.get('/day-summary', getDaySummary);

module.exports = router;