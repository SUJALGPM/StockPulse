import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/stockPulseService';

const ProductList = ({ products, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter products based on search term
  const filteredProducts = searchTerm
    ? products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        onDelete(productId);
      } catch (error) {
        alert('Failed to delete product: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const getInventoryStatus = (stockLevel, reorderThreshold) => {
    if (stockLevel === 0) return 'OUT_OF_STOCK';
    if (stockLevel <= reorderThreshold) return 'LOW_STOCK';
    return 'NORMAL';
  };

  const getInventoryBadgeClass = (inventoryStatus) => {
    switch (inventoryStatus) {
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found.</p>
        <Link to="/products/new" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Create New Product
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name, SKU, or category..."
            className="block w-full pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const inventoryStatus = getInventoryStatus(product.stockLevel, product.reorderThreshold);
          return (
            <div key={product._id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Price: ₹{product.currentPrice.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Stock: {product.stockLevel}</p>
                  <p className="text-sm text-gray-500">Threshold: {product.reorderThreshold}</p>
                  <p className="text-sm text-gray-500">
                    Inventory: 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInventoryBadgeClass(inventoryStatus)}`}>
                      {inventoryStatus.replace('_', ' ')}
                    </span>
                  </p>
                </div>
                <div className="mt-4 flex justify-between">
                  <Link to={`/products/${product._id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    View Details
                  </Link>
                  <div>
                    <Link to={`/products/${product._id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mr-3">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;