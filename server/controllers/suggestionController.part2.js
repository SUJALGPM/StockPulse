// Generate reorder suggestion using LLM or fallback logic
const generateReorderSuggestion = async (productId, triggerReason) => {
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
      recommendation = JSON.parse(llmResponse);
    } catch (llmError) {
      // Fallback to deterministic logic when LLM is unavailable
      console.log('LLM unavailable, using fallback reorder logic');
      
      // Deterministic reorder logic based on product data
      if (triggerReason === 'INVENTORY_LOW') {
        // Calculate reorder quantity based on demand velocity and desired coverage
        const weeksOfCoverage = 4; // Target 4 weeks of stock
        const requiredStock = product.demandVelocity * weeksOfCoverage;
        const reorderQuantity = Math.max(requiredStock - product.stockLevel, product.reorderThreshold * 2);
        
        recommendation = {
          recommendedQuantity: reorderQuantity,
          confidence: 0.85,
          reasoning: `Low inventory triggered reorder. Based on demand velocity (${product.demandVelocity}) and target ${weeksOfCoverage}-week coverage, recommended quantity is ${reorderQuantity}.`
        };
      } else if (triggerReason === 'DEMAND_SPIKE') {
        // For demand spikes, order extra to account for continued high demand
        const baseReorder = product.reorderThreshold * 3;
        const spikeAdjustment = product.demandVelocity * 2;
        const reorderQuantity = baseReorder + spikeAdjustment;
        
        recommendation = {
          recommendedQuantity: reorderQuantity,
          confidence: 0.8,
          reasoning: `Demand spike detected. Recommended higher quantity (${reorderQuantity}) to accommodate sustained high demand (${product.demandVelocity}).`
        };
      } else {
        // Default reorder logic
        const reorderQuantity = product.reorderThreshold * 2;
        
        recommendation = {
          recommendedQuantity: reorderQuantity,
          confidence: 0.7,
          reasoning: `Standard reorder triggered. Recommended quantity (${reorderQuantity}) based on reorder threshold (${product.reorderThreshold}).`
        };
      }
    }

    // Create reorder suggestion
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