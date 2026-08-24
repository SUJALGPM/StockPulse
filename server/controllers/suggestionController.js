const PricingSuggestion = require('../models/PricingSuggestion');
const ReorderSuggestion = require('../models/ReorderSuggestion');
const Product = require('../models/Product');
const llmService = require('../utils/llmService');
const { getConnectionStatus } = require('../config/db');
const localStorage = require('../utils/localStorage');

// Generate pricing suggestion using LLM or fallback logic
const generatePricingSuggestion = async (productId, triggerReason) => {
  try {
    const { isConnected } = getConnectionStatus();
    let product;

    if (isConnected) {
      product = await Product.findById(productId);
    } else {
      product = localStorage.findOneProduct({ _id: productId });
    }

    if (!product) {
      throw new Error('Product not found');
    }

    let recommendation;

    try {
      const prompt = `As an AI commerce advisor, analyze this product and provide pricing recommendations:

Product: ${product.name} (SKU: ${product.sku})
Category: ${product.category}
Current Price: $${product.currentPrice}
Current Stock: ${product.stockLevel}
Reorder Threshold: ${product.reorderThreshold}
Demand Velocity: ${product.demandVelocity}
Trigger Reason: ${triggerReason}

Based on the trigger reason, recommend:
1. A new price
2. Direction of change (INCREASE/DECREASE/NO_CHANGE)
3. Confidence score (0.0 to 1.0)
4. Business reasoning for the recommendation

Respond ONLY in JSON format:
{"recommendedPrice": number, "changeDirection": "INCREASE|DECREASE|NO_CHANGE", "confidence": number, "reasoning": "string"}`;

      const llmResponse = await llmService.callLLM(prompt);
      recommendation = JSON.parse(llmResponse);
    } catch (llmError) {
      console.log('LLM unavailable, using fallback pricing logic');

      if (triggerReason === 'INVENTORY_LOW' && product.demandVelocity > 5) {
        const newPrice = product.currentPrice * 1.1;
        recommendation = {
          recommendedPrice: parseFloat(newPrice.toFixed(2)),
          changeDirection: 'INCREASE',
          confidence: 0.8,
          reasoning: `Low stock (${product.stockLevel}) combined with high demand velocity (${product.demandVelocity}) suggests increasing price to manage demand.`
        };
      } else if (triggerReason === 'DEMAND_SPIKE' && product.stockLevel > product.reorderThreshold * 2) {
        const newPrice = product.currentPrice * 1.05;
        recommendation = {
          recommendedPrice: parseFloat(newPrice.toFixed(2)),
          changeDirection: 'INCREASE',
          confidence: 0.7,
          reasoning: `Demand spike detected with healthy stock levels (${product.stockLevel}), suggesting a modest price increase.`
        };
      } else if (product.stockLevel > product.reorderThreshold * 3 && product.demandVelocity < 3) {
        const newPrice = product.currentPrice * 0.95;
        recommendation = {
          recommendedPrice: parseFloat(newPrice.toFixed(2)),
          changeDirection: 'DECREASE',
          confidence: 0.75,
          reasoning: `Excess stock (${product.stockLevel}) with low demand velocity (${product.demandVelocity}) suggests decreasing price to boost sales.`
        };
      } else {
        recommendation = {
          recommendedPrice: product.currentPrice,
          changeDirection: 'NO_CHANGE',
          confidence: 0.6,
          reasoning: `Current pricing appears optimal based on stock levels (${product.stockLevel}) and demand velocity (${product.demandVelocity}).`
        };
      }
    }

    const pricingSuggestionData = {
      productId: product._id,
      recommendedPrice: recommendation.recommendedPrice,
      changeDirection: recommendation.changeDirection,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      triggerReason
    };

    if (isConnected) {
      const pricingSuggestion = new PricingSuggestion(pricingSuggestionData);
      return await pricingSuggestion.save();
    } else {
      return localStorage.createPricingSuggestion(pricingSuggestionData);
    }
  } catch (error) {
    console.error('Error generating pricing suggestion:', error);
    throw error;
  }
};

// Generate reorder suggestion using LLM or fallback logic
const generateReorderSuggestion = async (productId, triggerReason) => {
  try {
    const { isConnected } = getConnectionStatus();
    let product;

    if (isConnected) {
      product = await Product.findById(productId);
    } else {
      product = localStorage.findOneProduct({ _id: productId });
    }

    if (!product) {
      throw new Error('Product not found');
    }

    let recommendation;

    try {
      const prompt = `As an AI supply chain advisor, analyze this product and provide reorder recommendations:

Product: ${product.name} (SKU: ${product.sku})
Category: ${product.category}
Current Stock: ${product.stockLevel}
Reorder Threshold: ${product.reorderThreshold}
Demand Velocity: ${product.demandVelocity}
Trigger Reason: ${triggerReason}

Respond ONLY in JSON format:
{"recommendedQuantity": number, "confidence": number, "reasoning": "string"}`;

      const llmResponse = await llmService.callLLM(prompt);
      recommendation = JSON.parse(llmResponse);
    } catch (llmError) {
      console.log('LLM unavailable, using fallback reorder logic');

      if (triggerReason === 'INVENTORY_LOW') {
        const baseReorder = Math.max(product.reorderThreshold * 2 - product.stockLevel, 1);
        let reorderQuantity = baseReorder;
        if (product.demandVelocity > 10) {
          reorderQuantity = baseReorder * 1.5;
        } else if (product.demandVelocity > 5) {
          reorderQuantity = baseReorder * 1.2;
        }

        recommendation = {
          recommendedQuantity: Math.ceil(reorderQuantity),
          confidence: 0.85,
          reasoning: `Low inventory alert. Current stock (${product.stockLevel}) below reorder threshold (${product.reorderThreshold}). Recommended quantity accounts for demand velocity (${product.demandVelocity}).`
        };
      } else if (triggerReason === 'DEMAND_SPIKE') {
        const baseReorder = product.reorderThreshold * 2;
        const spikeAdjustment = product.demandVelocity * 2;
        const reorderQuantity = Math.ceil(baseReorder + spikeAdjustment);

        recommendation = {
          recommendedQuantity: reorderQuantity,
          confidence: 0.8,
          reasoning: `Demand spike detected. Recommended higher quantity (${reorderQuantity}) to accommodate sustained high demand (${product.demandVelocity}).`
        };
      } else {
        const reorderQuantity = product.reorderThreshold * 2;

        recommendation = {
          recommendedQuantity: reorderQuantity,
          confidence: 0.7,
          reasoning: `Standard reorder triggered. Recommended quantity (${reorderQuantity}) based on reorder threshold (${product.reorderThreshold}).`
        };
      }
    }

    const reorderSuggestionData = {
      productId: product._id,
      recommendedQuantity: recommendation.recommendedQuantity,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      triggerReason
    };

    if (isConnected) {
      const reorderSuggestion = new ReorderSuggestion(reorderSuggestionData);
      return await reorderSuggestion.save();
    } else {
      return localStorage.createReorderSuggestion(reorderSuggestionData);
    }
  } catch (error) {
    console.error('Error generating reorder suggestion:', error);
    throw error;
  }
};

// Get all pricing suggestions
const getPricingSuggestions = async (req, res) => {
  try {
    const { isConnected } = getConnectionStatus();

    let suggestions;
    if (isConnected) {
      suggestions = await PricingSuggestion.find({ status: 'PENDING' })
        .populate('productId', 'sku name currentPrice stockLevel')
        .sort({ createdAt: -1 });
    } else {
      suggestions = localStorage.findPricingSuggestions({ status: 'PENDING' });
      suggestions = suggestions.map(suggestion => {
        const product = localStorage.findOneProduct({ _id: suggestion.productId });
        return {
          ...suggestion,
          product: product ? {
            sku: product.sku,
            name: product.name,
            currentPrice: product.currentPrice,
            stockLevel: product.stockLevel
          } : null
        };
      });
    }

    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Error fetching pricing suggestions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all reorder suggestions
const getReorderSuggestions = async (req, res) => {
  try {
    const { isConnected } = getConnectionStatus();

    let suggestions;
    if (isConnected) {
      suggestions = await ReorderSuggestion.find({ status: 'PENDING' })
        .populate('productId', 'sku name stockLevel reorderThreshold')
        .sort({ createdAt: -1 });
    } else {
      suggestions = localStorage.findReorderSuggestions({ status: 'PENDING' });
      suggestions = suggestions.map(suggestion => {
        const product = localStorage.findOneProduct({ _id: suggestion.productId });
        return {
          ...suggestion,
          product: product ? {
            sku: product.sku,
            name: product.name,
            stockLevel: product.stockLevel,
            reorderThreshold: product.reorderThreshold
          } : null
        };
      });
    }

    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Error fetching reorder suggestions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Accept pricing suggestion
const acceptPricingSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getConnectionStatus();

    let suggestion;
    if (isConnected) {
      suggestion = await PricingSuggestion.findById(id);
    } else {
      const suggestions = localStorage.findPricingSuggestions({ _id: id });
      suggestion = suggestions.length > 0 ? suggestions[0] : null;
    }

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Pricing suggestion not found' });
    }

    if (isConnected) {
      suggestion.status = 'ACCEPTED';
      await suggestion.save();

      const product = await Product.findById(suggestion.productId);
      if (product) {
        product.currentPrice = suggestion.recommendedPrice;
        await product.save();
      }
    } else {
      localStorage.updatePricingSuggestion(id, { status: 'ACCEPTED' });
      const product = localStorage.findOneProduct({ _id: suggestion.productId });
      if (product) {
        localStorage.updateProduct(suggestion.productId, {
          currentPrice: suggestion.recommendedPrice
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Pricing suggestion accepted successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error accepting pricing suggestion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Accept reorder suggestion
const acceptReorderSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getConnectionStatus();

    let suggestion;
    if (isConnected) {
      suggestion = await ReorderSuggestion.findById(id);
    } else {
      const suggestions = localStorage.findReorderSuggestions({ _id: id });
      suggestion = suggestions.length > 0 ? suggestions[0] : null;
    }

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Reorder suggestion not found' });
    }

    if (isConnected) {
      suggestion.status = 'ACCEPTED';
      await suggestion.save();
    } else {
      localStorage.updateReorderSuggestion(id, { status: 'ACCEPTED' });
    }

    res.status(200).json({
      success: true,
      message: 'Reorder suggestion accepted successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error accepting reorder suggestion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reject pricing suggestion
const rejectPricingSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getConnectionStatus();

    let suggestion;
    if (isConnected) {
      suggestion = await PricingSuggestion.findById(id);
    } else {
      const suggestions = localStorage.findPricingSuggestions({ _id: id });
      suggestion = suggestions.length > 0 ? suggestions[0] : null;
    }

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Pricing suggestion not found' });
    }

    if (isConnected) {
      suggestion.status = 'REJECTED';
      await suggestion.save();
    } else {
      localStorage.updatePricingSuggestion(id, { status: 'REJECTED' });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing suggestion rejected successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error rejecting pricing suggestion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reject reorder suggestion
const rejectReorderSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getConnectionStatus();

    let suggestion;
    if (isConnected) {
      suggestion = await ReorderSuggestion.findById(id);
    } else {
      const suggestions = localStorage.findReorderSuggestions({ _id: id });
      suggestion = suggestions.length > 0 ? suggestions[0] : null;
    }

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Reorder suggestion not found' });
    }

    if (isConnected) {
      suggestion.status = 'REJECTED';
      await suggestion.save();
    } else {
      localStorage.updateReorderSuggestion(id, { status: 'REJECTED' });
    }

    res.status(200).json({
      success: true,
      message: 'Reorder suggestion rejected successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error rejecting reorder suggestion:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  generatePricingSuggestion,
  generateReorderSuggestion,
  getPricingSuggestions,
  getReorderSuggestions,
  acceptPricingSuggestion,
  acceptReorderSuggestion,
  rejectPricingSuggestion,
  rejectReorderSuggestion
};