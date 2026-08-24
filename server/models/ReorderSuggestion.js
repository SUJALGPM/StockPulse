const mongoose = require('mongoose');

const reorderSuggestionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  recommendedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  reasoning: {
    type: String,
    required: true
  },
  triggerReason: {
    type: String,
    enum: ['INVENTORY_LOW', 'DEMAND_SPIKE', 'MANUAL']
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

// Index to prevent duplicate pending suggestions for the same product + triggerReason
reorderSuggestionSchema.index({ productId: 1, triggerReason: 1, status: 1 });

module.exports = mongoose.model('ReorderSuggestion', reorderSuggestionSchema);