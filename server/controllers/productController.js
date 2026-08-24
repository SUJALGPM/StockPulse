const Product = require('../models/Product');
const InventorySnapshot = require('../models/InventorySnapshot');
const { generatePricingSuggestion, generateReorderSuggestion } = require('./suggestionController');
const { getConnectionStatus } = require('../config/db');
const localStorage = require('../utils/localStorage');

// Helper function to calculate category average velocity (simplified for now)
const getCategoryAverageVelocity = async (category) => {
  return 5;
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    const { isConnected } = getConnectionStatus();
    const {
      sku,
      name,
      category,
      currentPrice,
      stockLevel,
      reorderThreshold,
      demandVelocity
    } = req.body;

    if (isConnected) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }

      const product = new Product({
        sku, name, category, currentPrice, stockLevel, reorderThreshold, demandVelocity
      });

      const savedProduct = await product.save();

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: savedProduct
      });
    } else {
      const existingProduct = localStorage.findOneProduct({ sku });
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }

      const savedProduct = localStorage.createProduct({
        sku, name, category, currentPrice, stockLevel, reorderThreshold, demandVelocity,
        status: 'ACTIVE'
      });

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: savedProduct
      });
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { isConnected } = getConnectionStatus();
    let products;

    if (isConnected) {
      products = await Product.find().sort({ createdAt: -1 });
    } else {
      products = localStorage.findProducts().sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getConnectionStatus();

    const product = isConnected
      ? await Product.findById(id)
      : localStorage.findOneProduct({ _id: id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { isConnected } = getConnectionStatus();

    const allowedUpdates = [
      'name',
      'category',
      'currentPrice',
      'reorderThreshold',
      'demandVelocity',
      'status'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const product = isConnected
      ? await Product.findByIdAndUpdate(id, filteredUpdates, { new: true, runValidators: true })
      : localStorage.updateProduct(id, filteredUpdates);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getConnectionStatus();

    let deleted;
    if (isConnected) {
      deleted = await Product.findByIdAndDelete(id);
    } else {
      const exists = localStorage.findOneProduct({ _id: id });
      deleted = exists ? localStorage.deleteProduct(id) : null;
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update stock level
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body;
    const { isConnected } = getConnectionStatus();

    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be an integer'
      });
    }

    if (type && !['STOCK_IN', 'STOCK_OUT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either STOCK_IN or STOCK_OUT'
      });
    }

    const product = isConnected
      ? await Product.findById(id)
      : localStorage.findOneProduct({ _id: id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const newStockLevel = product.stockLevel + quantity;

    if (newStockLevel < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock. Cannot reduce below zero.'
      });
    }

    const previousStockLevel = product.stockLevel;
    const reorderThreshold = product.reorderThreshold;

    let updatedProduct;
    if (isConnected) {
      product.stockLevel = newStockLevel;
      updatedProduct = await product.save();
    } else {
      updatedProduct = localStorage.updateProduct(id, { stockLevel: newStockLevel });
    }

    const categoryAverageVelocity = await getCategoryAverageVelocity(product.category);

    let savedSnapshot;
    if (isConnected) {
      const snapshot = new InventorySnapshot({
        productId: product._id,
        stockLevel: updatedProduct.stockLevel,
        demandVelocity: product.demandVelocity,
        categoryAverageVelocity
      });
      savedSnapshot = await snapshot.save();
    } else {
      savedSnapshot = localStorage.createInventorySnapshot({
        productId: product._id,
        stockLevel: updatedProduct.stockLevel,
        demandVelocity: product.demandVelocity,
        categoryAverageVelocity
      });
    }

    if (previousStockLevel > reorderThreshold && newStockLevel <= reorderThreshold) {
      try {
        await generatePricingSuggestion(product._id, 'INVENTORY_LOW');
        await generateReorderSuggestion(product._id, 'INVENTORY_LOW');
      } catch (error) {
        console.error('Error generating suggestions:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        product: updatedProduct,
        snapshot: savedSnapshot
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Process order/sale
const processOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const { isConnected } = getConnectionStatus();

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer'
      });
    }

    const product = isConnected
      ? await Product.findById(id)
      : localStorage.findOneProduct({ _id: id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stockLevel < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this order'
      });
    }

    const previousStockLevel = product.stockLevel;
    const previousDemandVelocity = product.demandVelocity;
    const reorderThreshold = product.reorderThreshold;

    const newStockLevel = product.stockLevel - quantity;
    const newDemandVelocity = product.demandVelocity + 1;

    let updatedProduct;
    if (isConnected) {
      product.stockLevel = newStockLevel;
      product.demandVelocity = newDemandVelocity;
      updatedProduct = await product.save();
    } else {
      updatedProduct = localStorage.updateProduct(id, {
        stockLevel: newStockLevel,
        demandVelocity: newDemandVelocity
      });
    }

    const categoryAverageVelocity = await getCategoryAverageVelocity(product.category);

    let savedSnapshot;
    if (isConnected) {
      const snapshot = new InventorySnapshot({
        productId: product._id,
        stockLevel: updatedProduct.stockLevel,
        demandVelocity: updatedProduct.demandVelocity,
        categoryAverageVelocity
      });
      savedSnapshot = await snapshot.save();
    } else {
      savedSnapshot = localStorage.createInventorySnapshot({
        productId: product._id,
        stockLevel: updatedProduct.stockLevel,
        demandVelocity: updatedProduct.demandVelocity,
        categoryAverageVelocity
      });
    }

    if (previousStockLevel > reorderThreshold && updatedProduct.stockLevel <= reorderThreshold) {
      try {
        await generatePricingSuggestion(product._id, 'INVENTORY_LOW');
        await generateReorderSuggestion(product._id, 'INVENTORY_LOW');
      } catch (error) {
        console.error('Error generating low stock suggestions:', error);
      }
    }

    if (previousDemandVelocity > 0 &&
        updatedProduct.demandVelocity >= previousDemandVelocity * 1.5) {
      try {
        await generatePricingSuggestion(product._id, 'DEMAND_SPIKE');
        await generateReorderSuggestion(product._id, 'DEMAND_SPIKE');
      } catch (error) {
        console.error('Error generating demand spike suggestions:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order processed successfully',
      data: {
        product: updatedProduct,
        snapshot: savedSnapshot
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  processOrder
};