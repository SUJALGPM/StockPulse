// Get all pricing suggestions
const getPricingSuggestions = async (req, res) => {
  try {
    const { isConnected } = getConnectionStatus();
    
    let suggestions;
    if (isConnected) {
      suggestions = await PricingSuggestion.find().sort({ createdAt: -1 });
    } else {
      suggestions = localStorage.findPricingSuggestions().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
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
    const { isConnected } = getConnectionStatus();
    
    let suggestions;
    if (isConnected) {
      suggestions = await ReorderSuggestion.find().sort({ createdAt: -1 });
    } else {
      suggestions = localStorage.findReorderSuggestions().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
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
      suggestion.status = 'ACCEPTED';
      await suggestion.save();
    } else {
      suggestion = localStorage.updatePricingSuggestion(id, { status: 'ACCEPTED' });
    }
    
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
      suggestion.status = 'ACCEPTED';
      await suggestion.save();
    } else {
      suggestion = localStorage.updateReorderSuggestion(id, { status: 'ACCEPTED' });
    }
    
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