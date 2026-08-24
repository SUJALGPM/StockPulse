const PricingSuggestion = require('../models/PricingSuggestion');
const ReorderSuggestion = require('../models/ReorderSuggestion');
const Product = require('../models/Product');
const llmService = require('../utils/llmService');

// Generate pricing suggestion using LLM
const generatePricingSuggestion = async (productId, triggerReason) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

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
    let recommendation;
    try {
      recommendation = JSON.parse(llmResponse);
    } catch (parseError) {
      // If parsing fails, create a default recommendation
      recommendation = {
        recommendedPrice: product.currentPrice,
        changeDirection: 'NO_CHANGE',
        confidence: 0.5,
        reasoning: 'Unable to parse LLM response, using current price.'
      };
    }

    // Create pricing suggestion
    const pricingSuggestion = new PricingSuggestion({
      productId: product._id,
      recommendedPrice: recommendation.recommendedPrice,
      changeDirection: recommendation.changeDirection,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      triggerReason
    });

    return await pricingSuggestion.save();
  } catch (error) {
    console.error('Error generating pricing suggestion:', error);
    throw error;
  }
};

// Generate reorder suggestion using LLM
const generateReorderSuggestion = async (productId, triggerReason) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create prompt for LLM
    const prompt = `
      As an AI commerce advisor, analyze this product and provide reorder recommendations:

      Product: ${product.name} (SKU: ${product.sku})
      Category: ${product.category}
      Current Price: ${product.currentPrice}
      Current Stock: ${product.stockLevel}
      Reorder Threshold: ${product.reorderThreshold}
      Demand Velocity: ${product.demandVelocity}
      Trigger Reason: ${triggerReason}

      Based on the trigger reason, recommend:
      1. A reorder quantity
      2. Confidence score (0.0 to 1.0)
      3. Business reasoning for the recommendation

      Respond in JSON format:
      {
        "recommendedQuantity": number,
        "confidence": number,
        "reasoning": "string"
      }
    `;

    // Call LLM service
    const llmResponse = await llmService.callLLM(prompt);
    
    // Parse LLM response
    let recommendation;
    try {
      recommendation = JSON.parse(llmResponse);
    } catch (parseError) {
      // If parsing fails, create a default recommendation
      recommendation = {
        recommendedQuantity: Math.max(50, product.reorderThreshold * 3),
        confidence: 0.5,
        reasoning: 'Unable to parse LLM response, using default calculation.'
      };
    }

    // Create reorder suggestion
    const reorderSuggestion = new ReorderSuggestion({
      productId: product._id,
      recommendedQuantity: recommendation.recommendedQuantity,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      triggerReason
    });

    return await reorderSuggestion.save();
  } catch (error) {

// Get all pricing suggestions
const getPricingSuggestions = async (req, res) => {
  try {
    const suggestions = await PricingSuggestion.find()
      .populate('productId', 'sku name category currentPrice stockLevel')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all reorder suggestions
const getReorderSuggestions = async (req, res) => {
  try {
    const suggestions = await ReorderSuggestion.find()
      .populate('productId', 'sku name category currentPrice stockLevel')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Accept pricing suggestion
const acceptPricingSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const suggestion = await PricingSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Pricing suggestion not found'
      });
    }
    
    // Update product price
    const product = await Product.findById(suggestion.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.currentPrice = suggestion.recommendedPrice;
    product.status = 'ACTIVE';
    await product.save();
    
    suggestion.status = 'ACCEPTED';
    await suggestion.save();
    
    res.status(200).json({
      success: true,
      message: 'Pricing suggestion accepted successfully',
      data: suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Accept reorder suggestion
const acceptReorderSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const suggestion = await ReorderSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Reorder suggestion not found'
      });
    }
    
    suggestion.status = 'ACCEPTED';
    await suggestion.save();
    
    res.status(200).json({
      success: true,
      message: 'Reorder suggestion accepted successfully',
      data: suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reject pricing suggestion
const rejectPricingSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const suggestion = await PricingSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Pricing suggestion not found'
      });
    }
    
    suggestion.status = 'REJECTED';
    await suggestion.save();
    
    res.status(200).json({
      success: true,
      message: 'Pricing suggestion rejected successfully',
      data: suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reject reorder suggestion
const rejectReorderSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const suggestion = await ReorderSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Reorder suggestion not found'
      });
    }
    
    suggestion.status = 'REJECTED';
    await suggestion.save();
    
    res.status(200).json({
      success: true,
      message: 'Reorder suggestion rejected successfully',
      data: suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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
