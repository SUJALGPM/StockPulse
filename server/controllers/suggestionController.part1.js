const PricingSuggestion = require('../models/PricingSuggestion');
const ReorderSuggestion = require('../models/ReorderSuggestion');
const Product = require('../models/Product');
const llmService = require('../utils/llmService');
const { getConnectionStatus } = require('../config/db');
const localStorage = require('../utils/localStorage');

// Generate pricing suggestion using LLM or fallback logic
const generatePricingSuggestion = async (productId, triggerReason) => {
  try {
    // Check if we're using local storage
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

    // Check if LLM service is available (budget not exceeded)
    try {
      // Create prompt for LLM
      const prompt = `
        As an AI commerce advisor, analyze this product and provide pricing recommendations:

        Product: ${product.name} (SKU: ${product.sku})
        Category: ${product.category}
        Current Price: ${product.currentPrice}
        Current Stock: ${product.stockLevel}
        Reorder Threshold: ${product.reorderThreshold}
        Demand Velocity: ${product.demandVelocity}
        Trigger Reason: ${triggerReason}

        Based on the trigger reason, recommend:
        1. A new price
        2. Direction of change (INCREASE/DECREASE/NO_CHANGE)
        3. Confidence score (0.0 to 1.0)
        4. Business reasoning for the recommendation

        Respond in JSON format:
        {
          "recommendedPrice": number,
          "changeDirection": "INCREASE|DECREASE|NO_CHANGE",
          "confidence": number,
          "reasoning": "string"
        }
      `;

      // Call LLM service
      const llmResponse = await llmService.callLLM(prompt);
      
      // Parse LLM response
      recommendation = JSON.parse(llmResponse);
    } catch (llmError) {
      // Fallback to deterministic logic when LLM is unavailable
      console.log('LLM unavailable, using fallback pricing logic');
      
      // Deterministic pricing logic based on product data
      if (triggerReason === 'INVENTORY_LOW' && product.demandVelocity > 5) {
        // High demand + low stock = increase price
        const newPrice = product.currentPrice * 1.1; // 10% increase
        recommendation = {
          recommendedPrice: parseFloat(newPrice.toFixed(2)),
          changeDirection: 'INCREASE',
          confidence: 0.8,
          reasoning: `Low stock (${product.stockLevel}) combined with high demand velocity (${product.demandVelocity}) suggests increasing price to manage demand.`
        };
      } else if (triggerReason === 'DEMAND_SPIKE' && product.stockLevel > product.reorderThreshold * 2) {
        // High stock + demand spike = increase price
        const newPrice = product.currentPrice * 1.05; // 5% increase
        recommendation = {
          recommendedPrice: parseFloat(newPrice.toFixed(2)),
          changeDirection: 'INCREASE',
          confidence: 0.7,
          reasoning: `Demand spike detected with healthy stock levels (${product.stockLevel}), suggesting a modest price increase.`
        };
      } else if (product.stockLevel > product.reorderThreshold * 3 && product.demandVelocity < 3) {
        // Excess stock + low demand = decrease price
        const newPrice = product.currentPrice * 0.95; // 5% decrease
        recommendation = {
          recommendedPrice: parseFloat(newPrice.toFixed(2)),
          changeDirection: 'DECREASE',
          confidence: 0.75,
          reasoning: `Excess stock (${product.stockLevel}) with low demand velocity (${product.demandVelocity}) suggests decreasing price to boost sales.`
        };
      } else {
        // Default: no change
        recommendation = {
          recommendedPrice: product.currentPrice,
          changeDirection: 'NO_CHANGE',
          confidence: 0.6,
          reasoning: `Current pricing appears optimal based on stock levels (${product.stockLevel}) and demand velocity (${product.demandVelocity}).`
        };
      }
    }

    // Create pricing suggestion
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