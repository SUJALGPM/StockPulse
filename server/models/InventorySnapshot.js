const mongoose = require('mongoose');

const inventorySnapshotSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  stockLevel: {
    type: Number,
    required: true,
    min: 0
  },
  demandVelocity: {
    type: Number,
    required: true,
    min: 0
  },
  categoryAverageVelocity: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Index to prevent duplicate pending suggestions (to be used later)
inventorySnapshotSchema.index({ productId: 1 });

module.exports = mongoose.model('InventorySnapshot', inventorySnapshotSchema);