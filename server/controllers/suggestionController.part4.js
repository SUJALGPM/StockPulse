// Reject pricing suggestion
const rejectPricingSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getConnectionStatus();
    
    let suggestion;
    if (isConnected) {
      suggestion = await PricingSuggestion.findById(id);
    } else {
      suggestion = localStorage.findPricingSuggestions({ _id: id })[0];
    }
    
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Pricing suggestion not found'
      });
    }
    
    if (isConnected) {
      suggestion.status = 'REJECTED';
      await suggestion.save();
    } else {
      suggestion = localStorage.updatePricingSuggestion(id, { status: 'REJECTED' });
    }
    
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
    const { isConnected } = getConnectionStatus();
    
    let suggestion;
    if (isConnected) {
      suggestion = await ReorderSuggestion.findById(id);
    } else {
      suggestion = localStorage.findReorderSuggestions({ _id: id })[0];
    }
    
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Reorder suggestion not found'
      });
    }
    
    if (isConnected) {
      suggestion.status = 'REJECTED';
      await suggestion.save();
    } else {
      suggestion = localStorage.updateReorderSuggestion(id, { status: 'REJECTED' });
    }
    
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