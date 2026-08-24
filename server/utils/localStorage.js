// Local storage fallback for demo purposes
class LocalStorage {
  constructor() {
    this.data = {
      products: [],
      pricingSuggestions: [],
      reorderSuggestions: [],
      inventorySnapshots: []
    };
    this.nextId = 1;
    this.loadFromFile();
  }

  // Generate unique ID
  generateId() {
    return `local_${this.nextId++}`;
  }

  // Load data from file if exists
  loadFromFile() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(__dirname, '../data/demoData.json');
      if (fs.existsSync(dataPath)) {
        const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        this.data = { ...this.data, ...fileData };
        // Update nextId based on existing data
        const allIds = [
          ...this.data.products.map(p => p._id),
          ...this.data.pricingSuggestions.map(p => p._id),
          ...this.data.reorderSuggestions.map(p => p._id),
          ...this.data.inventorySnapshots.map(p => p._id)
        ].filter(id => id.startsWith('local_'));

        if (allIds.length > 0) {
          const maxId = Math.max(...allIds.map(id => parseInt(id.split('_')[1])));
          this.nextId = maxId + 1;
        }
      }
    } catch (error) {
      console.log('No existing demo data file found, starting fresh');
    }
  }

  // Save data to file
  saveToFile() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '../data');

      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dataPath = path.join(dataDir, 'demoData.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.log('Could not save demo data to file:', error.message);
    }
  }

  // Product operations
  findProducts(query = {}) {
    return this.data.products.filter(product => {
      for (let key in query) {
        if (product[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  findOneProduct(query) {
    return this.findProducts(query)[0] || null;
  }

  createProduct(productData) {
    const product = {
      _id: this.generateId(),
      status: 'ACTIVE',
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.products.push(product);
    this.saveToFile();
    return product;
  }

  updateProduct(id, updates) {
    const productIndex = this.data.products.findIndex(p => p._id === id);
    if (productIndex === -1) return null;

    this.data.products[productIndex] = {
      ...this.data.products[productIndex],
      ...updates,
      updatedAt: new Date()
    };
    this.saveToFile();
    return this.data.products[productIndex];
  }

  deleteProduct(id) {
    const productIndex = this.data.products.findIndex(p => p._id === id);
    if (productIndex === -1) return false;

    this.data.products.splice(productIndex, 1);
    this.saveToFile();
    return true;
  }

  countProducts(query = {}) {
    return this.findProducts(query).length;
  }

  // Suggestion operations
  findPricingSuggestions(query = {}) {
    return this.data.pricingSuggestions.filter(suggestion => {
      for (let key in query) {
        if (suggestion[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  findReorderSuggestions(query = {}) {
    return this.data.reorderSuggestions.filter(suggestion => {
      for (let key in query) {
        if (suggestion[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  createPricingSuggestion(suggestionData) {
    const suggestion = {
      _id: this.generateId(),
      status: 'PENDING',
      ...suggestionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.pricingSuggestions.push(suggestion);
    this.saveToFile();
    return suggestion;
  }

  createReorderSuggestion(suggestionData) {
    const suggestion = {
      _id: this.generateId(),
      status: 'PENDING',
      ...suggestionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.reorderSuggestions.push(suggestion);
    this.saveToFile();
    return suggestion;
  }

  updatePricingSuggestion(id, updates) {
    const suggestionIndex = this.data.pricingSuggestions.findIndex(s => s._id === id);
    if (suggestionIndex === -1) return null;

    this.data.pricingSuggestions[suggestionIndex] = {
      ...this.data.pricingSuggestions[suggestionIndex],
      ...updates,
      updatedAt: new Date()
    };
    this.saveToFile();
    return this.data.pricingSuggestions[suggestionIndex];
  }

  updateReorderSuggestion(id, updates) {
    const suggestionIndex = this.data.reorderSuggestions.findIndex(s => s._id === id);
    if (suggestionIndex === -1) return null;

    this.data.reorderSuggestions[suggestionIndex] = {
      ...this.data.reorderSuggestions[suggestionIndex],
      ...updates,
      updatedAt: new Date()
    };
    this.saveToFile();
    return this.data.reorderSuggestions[suggestionIndex];
  }

  // Inventory snapshot operations
  createInventorySnapshot(snapshotData) {
    const snapshot = {
      _id: this.generateId(),
      ...snapshotData,
      createdAt: new Date()
    };
    this.data.inventorySnapshots.push(snapshot);
    this.saveToFile();
    return snapshot;
  }

  findInventorySnapshots(query = {}) {
    return this.data.inventorySnapshots.filter(snapshot => {
      for (let key in query) {
        if (snapshot[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }
}

module.exports = new LocalStorage();