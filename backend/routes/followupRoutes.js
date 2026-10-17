const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getFollowups,
  addFollowup,
  updateFollowup,
  deleteFollowup,
} = require('../controllers/followupController');

router.use(authMiddleware);

router.get('/', getFollowups);
router.post('/', addFollowup);
router.patch('/:id', updateFollowup);
router.delete('/:id', deleteFollowup);

module.exports = router;