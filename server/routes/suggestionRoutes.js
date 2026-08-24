const express = require('express');
const {
  getPricingSuggestions,
  getReorderSuggestions,
  acceptPricingSuggestion,
  acceptReorderSuggestion,
  rejectPricingSuggestion,
  rejectReorderSuggestion
} = require('../controllers/suggestionController');

const router = express.Router();

// Pricing suggestions routes
router.route('/pricing')
  .get(getPricingSuggestions);

router.route('/pricing/:id/accept')
  .patch(acceptPricingSuggestion);

router.route('/pricing/:id/reject')
  .patch(rejectPricingSuggestion);

// Reorder suggestions routes
router.route('/reorder')
  .get(getReorderSuggestions);

router.route('/reorder/:id/accept')
  .patch(acceptReorderSuggestion);

router.route('/reorder/:id/reject')
  .patch(rejectReorderSuggestion);

module.exports = router;