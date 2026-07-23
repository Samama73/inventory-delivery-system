const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
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
  updateDeliveryGroupStatus
} = require('../controllers/deliveryController');

router.use(authMiddleware);

// Group (multi-item order) routes — inhe /:id se UPAR rakhna zaroori hai
router.get('/group/:order_id', getDeliveryGroup);
router.post('/group', addDeliveryGroup);
router.put('/group/:order_id', updateDeliveryGroup);
router.patch('/group/:order_id/status', updateDeliveryGroupStatus);
router.delete('/group/:order_id', deleteDeliveryGroup);

// Single item routes
router.get('/', getAllDeliveries);
router.get('/:id', getDeliveryById);
router.post('/', addDelivery);
router.put('/:id', updateDelivery);
router.patch('/:id/status', updateDeliveryStatus);
router.delete('/:id', deleteDelivery);

module.exports = router;