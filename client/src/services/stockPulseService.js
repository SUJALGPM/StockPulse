import api from './api';

// Product Service
export const productService = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch products' };
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product' };
    }
  },

  // Create product
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create product' };
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      const response = await api.patch(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update product' };
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete product' };
    }
  },

  // Update stock
  updateStock: async (id, stockData) => {
    try {
      const response = await api.patch(`/products/${id}/stock`, stockData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update stock' };
    }
  },

  // Process order
  processOrder: async (id, orderData) => {
    try {
      const response = await api.post(`/products/${id}/orders`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to process order' };
    }
  },
};

// Suggestion Service
export const suggestionService = {
  // Get pricing suggestions
  getPricingSuggestions: async () => {
    try {
      const response = await api.get('/suggestions/pricing');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pricing suggestions' };
    }
  },

  // Get reorder suggestions
  getReorderSuggestions: async () => {
    try {
      const response = await api.get('/suggestions/reorder');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch reorder suggestions' };
    }
  },

  // Accept pricing suggestion
  acceptPricingSuggestion: async (id) => {
    try {
      const response = await api.patch(`/suggestions/pricing/${id}/accept`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to accept pricing suggestion' };
    }
  },

  // Accept reorder suggestion
  acceptReorderSuggestion: async (id) => {
    try {
      const response = await api.patch(`/suggestions/reorder/${id}/accept`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to accept reorder suggestion' };
    }
  },

  // Reject pricing suggestion
  rejectPricingSuggestion: async (id) => {
    try {
      const response = await api.patch(`/suggestions/pricing/${id}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject pricing suggestion' };
    }
  },

  // Reject reorder suggestion
  rejectReorderSuggestion: async (id) => {
    try {
      const response = await api.patch(`/suggestions/reorder/${id}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject reorder suggestion' };
    }
  },
};

// Dashboard Service
export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard stats' };
    }
  },

  // Get inventory status
  getInventoryStatus: async () => {
    try {
      const response = await api.get('/dashboard/inventory-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inventory status' };
    }
  },
};