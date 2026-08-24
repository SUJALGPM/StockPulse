const mongoose = require('mongoose');
const localStorage = require('../utils/localStorage');

let isConnected = false;
let isUsingLocalFallback = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    isUsingLocalFallback = false;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Load demo data if database is empty
    await loadDemoDataIfEmpty();
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
    console.log('MongoDB unavailable - using local demo storage.');
    isConnected = false;
    isUsingLocalFallback = true;
    
    // Still load demo data for local storage
    await loadDemoDataIfEmpty();
  }
};

// Load demo data if database is empty
const loadDemoDataIfEmpty = async () => {
  try {
    let productCount = 0;
    
    if (isConnected) {
      // Check MongoDB
      const Product = require('../models/Product');
      productCount = await Product.countDocuments();
    } else {
      // Check local storage
      productCount = localStorage.countProducts();
    }
    
    if (productCount === 0) {
      console.log('Loading demo data...');
      await insertDemoData();
    }
  } catch (error) {
    console.log('Could not load demo data:', error.message);
  }
};

// Insert demo data
const insertDemoData = async () => {
  const demoProducts = [
    {
      sku: 'SKU-ELEC-001',
      name: 'Wireless Earbuds Pro',
      category: 'ELECTRONICS',
      currentPrice: 79.99,
      stockLevel: 45,
      reorderThreshold: 20,
      demandVelocity: 3,
      status: 'ACTIVE'
    },
    {
      sku: 'SKU-ELEC-002',
      name: 'USB-C Hub 7-Port',
      category: 'ELECTRONICS',
      currentPrice: 34.99,
      stockLevel: 120,
      reorderThreshold: 30,
      demandVelocity: 1,
      status: 'ACTIVE'
    },
    {
      sku: 'SKU-APP-001',
      name: 'Organic Cotton T-Shirt',
      category: 'APPAREL',
      currentPrice: 24.99,
      stockLevel: 8,
      reorderThreshold: 15,
      demandVelocity: 12,
      status: 'PRICE_REVIEW_PENDING'
    },
    {
      sku: 'SKU-APP-002',
      name: 'Running Shorts - Navy',
      category: 'APPAREL',
      currentPrice: 39.99,
      stockLevel: 55,
      reorderThreshold: 20,
      demandVelocity: 2,
      status: 'ACTIVE'
    },
    {
      sku: 'SKU-HOME-001',
      name: 'Ceramic Pour-Over Set',
      category: 'HOME',
      currentPrice: 49.99,
      stockLevel: 22,
      reorderThreshold: 10,
      demandVelocity: 4,
      status: 'ACTIVE'
    },
    {
      sku: 'SKU-HOME-002',
      name: 'LED Desk Lamp - Dimmable',
      category: 'HOME',
      currentPrice: 59.99,
      stockLevel: 0,
      reorderThreshold: 15,
      demandVelocity: 0,
      status: 'OUT_OF_STOCK'
    },
    {
      sku: 'SKU-ELEC-003',
      name: 'Portable Charger 20K',
      category: 'ELECTRONICS',
      currentPrice: 44.99,
      stockLevel: 18,
      reorderThreshold: 25,
      demandVelocity: 8,
      status: 'ACTIVE'
    },
    {
      sku: 'SKU-APP-003',
      name: 'Hoodie - Heather Grey',
      category: 'APPAREL',
      currentPrice: 54.99,
      stockLevel: 11,
      reorderThreshold: 12,
      demandVelocity: 15,
      status: 'ACTIVE'
    }
  ];

  try {
    if (isConnected) {
      // Use MongoDB
      const Product = require('../models/Product');
      await Product.insertMany(demoProducts);
      console.log('Demo data loaded into MongoDB');
    } else {
      // Use local storage
      demoProducts.forEach(product => {
        localStorage.createProduct(product);
      });
      console.log('Demo data loaded into local storage');
    }
  } catch (error) {
    console.log('Error loading demo data:', error.message);
  }
};

// Export connection status
const getConnectionStatus = () => ({
  isConnected,
  isUsingLocalFallback
});

module.exports = connectDB;
module.exports.getConnectionStatus = getConnectionStatus;