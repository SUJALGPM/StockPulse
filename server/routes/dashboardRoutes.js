const express = require('express');
const {
  getDashboardStats,
  getInventoryStatus
} = require('../controllers/dashboardController');

const router = express.Router();

// Dashboard routes
router.route('/stats')
  .get(getDashboardStats);

router.route('/inventory-status')
  .get(getInventoryStatus);

module.exports = router;