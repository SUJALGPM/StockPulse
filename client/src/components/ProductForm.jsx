import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/stockPulseService';

const ProductForm = ({ product, onSubmit }) => {
  const navigate = useNavigate();
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'ELECTRONICS',
    currentPrice: '',
    stockLevel: '',
    reorderThreshold: '',
    demandVelocity: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || 'ELECTRONICS',
        currentPrice: product.currentPrice || '',
        stockLevel: product.stockLevel || '',
        reorderThreshold: product.reorderThreshold || '',
        demandVelocity: product.demandVelocity || ''
      });
    }
  }, [isEdit, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.currentPrice || formData.currentPrice <= 0) {
      newErrors.currentPrice = 'Price must be a positive number';
    }

    if (formData.stockLevel === '' || formData.stockLevel < 0) {
      newErrors.stockLevel = 'Stock level must be a non-negative number';
    }

    if (formData.reorderThreshold === '' || formData.reorderThreshold < 0) {
      newErrors.reorderThreshold = 'Reorder threshold must be a non-negative number';
    }

    if (formData.demandVelocity === '' || formData.demandVelocity < 0) {
      newErrors.demandVelocity = 'Demand velocity must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ...formData,
        currentPrice: parseFloat(formData.currentPrice),
        stockLevel: parseInt(formData.stockLevel),
        reorderThreshold: parseInt(formData.reorderThreshold),
        demandVelocity: parseInt(formData.demandVelocity)
      };

      if (isEdit) {
        await productService.updateProduct(product._id, productData);
      } else {
        await productService.createProduct(productData);
      }

      onSubmit();
      navigate('/products');
    } catch (error) {
      if (error.message && error.message.includes('SKU already exists')) {
        setErrors(prev => ({
          ...prev,
          sku: 'A product with this SKU already exists'
        }));
      } else {
        alert('Error saving product: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {isEdit ? 'Edit Product' : 'Create New Product'}
        </h3>
        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* SKU */}
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="sku"
                  id="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  disabled={isEdit}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.sku ? 'border-red-300' : ''}`}
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.name ? 'border-red-300' : ''}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="APPAREL">Apparel</option>
                  <option value="HOME">Home</option>
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700">
                Price (₹) *
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="currentPrice"
                  id="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.currentPrice ? 'border-red-300' : ''}`}
                />
                {errors.currentPrice && <p className="mt-1 text-sm text-red-600">{errors.currentPrice}</p>}
              </div>
            </div>

            {/* Stock Level */}
            <div>
              <label htmlFor="stockLevel" className="block text-sm font-medium text-gray-700">
                Stock Level *
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="stockLevel"
                  id="stockLevel"
                  value={formData.stockLevel}
                  onChange={handleChange}
                  min="0"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.stockLevel ? 'border-red-300' : ''}`}
                />
                {errors.stockLevel && <p className="mt-1 text-sm text-red-600">{errors.stockLevel}</p>}
              </div>
            </div>

            {/* Reorder Threshold */}
            <div>
              <label htmlFor="reorderThreshold" className="block text-sm font-medium text-gray-700">
                Reorder Threshold *
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="reorderThreshold"
                  id="reorderThreshold"
                  value={formData.reorderThreshold}
                  onChange={handleChange}
                  min="0"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.reorderThreshold ? 'border-red-300' : ''}`}
                />
                {errors.reorderThreshold && <p className="mt-1 text-sm text-red-600">{errors.reorderThreshold}</p>}
              </div>
            </div>

            {/* Demand Velocity */}
            <div>
              <label htmlFor="demandVelocity" className="block text-sm font-medium text-gray-700">
                Demand Velocity *
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="demandVelocity"
                  id="demandVelocity"
                  value={formData.demandVelocity}
                  onChange={handleChange}
                  min="0"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.demandVelocity ? 'border-red-300' : ''}`}
                />
                {errors.demandVelocity && <p className="mt-1 text-sm text-red-600">{errors.demandVelocity}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;