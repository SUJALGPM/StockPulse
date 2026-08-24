const Product = require('../models/Product');
const PricingSuggestion = require('../models/PricingSuggestion');
const ReorderSuggestion = require('../models/ReorderSuggestion');
const { getConnectionStatus } = require('../config/db');
const localStorage = require('../utils/localStorage');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const { isConnected } = getConnectionStatus();

    let allProducts, totalProducts, activeProducts, reviewPendingProducts;
    let pendingPricingSuggestions, pendingReorderSuggestions, recentProducts;

    if (isConnected) {
      totalProducts = await Product.countDocuments();
      activeProducts = await Product.countDocuments({ status: 'ACTIVE' });
      reviewPendingProducts = await Product.countDocuments({ status: 'PRICE_REVIEW_PENDING' });
      allProducts = await Product.find({}, 'stockLevel reorderThreshold demandVelocity currentPrice');
      pendingPricingSuggestions = await PricingSuggestion.countDocuments({ status: 'PENDING' });
      pendingReorderSuggestions = await ReorderSuggestion.countDocuments({ status: 'PENDING' });
      recentProducts = await Product.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('sku name category stockLevel currentPrice');
    } else {
      allProducts = localStorage.findProducts();
      totalProducts = allProducts.length;
      activeProducts = allProducts.filter(p => p.status === 'ACTIVE').length;
      reviewPendingProducts = allProducts.filter(p => p.status === 'PRICE_REVIEW_PENDING').length;
      pendingPricingSuggestions = localStorage.findPricingSuggestions({ status: 'PENDING' }).length;
      pendingReorderSuggestions = localStorage.findReorderSuggestions({ status: 'PENDING' }).length;
      recentProducts = [...allProducts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(p => ({
          sku: p.sku,
          name: p.name,
          category: p.category,
          stockLevel: p.stockLevel,
          currentPrice: p.currentPrice
        }));
    }

    let totalInventoryQty = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    let totalInventoryValue = 0;

    for (const product of allProducts) {
      totalInventoryQty += product.stockLevel;
      totalInventoryValue += product.stockLevel * (product.currentPrice || 0);

      if (product.stockLevel === 0) {
        outOfStockProducts++;
      } else if (product.stockLevel <= product.reorderThreshold) {
        lowStockProducts++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          reviewPending: reviewPendingProducts
        },
        inventory: {
          totalQuantity: totalInventoryQty,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          totalValue: parseFloat(totalInventoryValue.toFixed(2))
        },
        suggestions: {
          pricingPending: pendingPricingSuggestions,
          reorderPending: pendingReorderSuggestions
        },
        recentProducts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get inventory status overview
const getInventoryStatus = async (req, res) => {
  try {
    const { isConnected } = getConnectionStatus();

    let products;
    if (isConnected) {
      products = await Product.find({}, 'sku name category stockLevel reorderThreshold demandVelocity status')
        .sort({ createdAt: -1 });
    } else {
      products = localStorage.findProducts().sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    const inventoryOverview = products.map(product => {
      let status = 'NORMAL';
      if (product.stockLevel === 0) {
        status = 'OUT_OF_STOCK';
      } else if (product.stockLevel <= product.reorderThreshold) {
        status = 'LOW_STOCK';
      }

      return {
        id: product._id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        stockLevel: product.stockLevel,
        reorderThreshold: product.reorderThreshold,
        demandVelocity: product.demandVelocity,
        status: product.status,
        inventoryStatus: status
      };
    });

    res.status(200).json({
      success: true,
      data: inventoryOverview
    });
  } catch (error) {
    console.error('Error fetching inventory status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getDashboardStats,
  getInventoryStatus
};