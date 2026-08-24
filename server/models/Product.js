const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ELECTRONICS', 'APPAREL', 'HOME']
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stockLevel: {
    type: Number,
    required: true,
    min: 0
  },
  reorderThreshold: {
    type: Number,
    required: true,
    min: 0
  },
  demandVelocity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PRICE_REVIEW_PENDING'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

// Index to prevent duplicate pending suggestions (to be used later)
productSchema.index({ sku: 1 });

module.exports = mongoose.model('Product', productSchema);