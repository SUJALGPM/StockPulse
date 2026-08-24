const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  processOrder
} = require('../controllers/productController');

const router = express.Router();

// Product CRUD routes
router.route('/')
  .post(createProduct)
  .get(getAllProducts);

router.route('/:id')
  .get(getProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

// Stock and order routes
router.patch('/:id/stock', updateStock);
router.post('/:id/orders', processOrder);

module.exports = router;