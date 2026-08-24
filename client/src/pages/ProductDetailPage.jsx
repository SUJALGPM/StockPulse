import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { productService } from '../services/stockPulseService';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { data, loading, error } = useApi(() => productService.getProductById(id));

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const product = data?.data;

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <h2>{product.name}</h2>
      <p>SKU: {product.sku}</p>
      <p>Category: {product.category}</p>
      <p>Price: ₹{product.currentPrice.toFixed(2)}</p>
      <p>Stock: {product.stockLevel}</p>
      <Link to={`/products/${product._id}/edit`}>Edit Product</Link>
    </div>
  );
};

export default ProductDetailPage;