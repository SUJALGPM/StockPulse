import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { suggestionService } from '../services/stockPulseService';

const SuggestionsPage = () => {
  const { data: pricingData, loading: pricingLoading, error: pricingError } = useApi(suggestionService.getPricingSuggestions);
  const { data: reorderData, loading: reorderLoading, error: reorderError } = useApi(suggestionService.getReorderSuggestions);
  
  const [activeTab, setActiveTab] = useState('pricing');

  const pricingSuggestions = pricingData?.data || [];
  const reorderSuggestions = reorderData?.data || [];

  return (
    <div>
      <h2>AI Recommendations</h2>
      
      <div>
        <button
          onClick={() => setActiveTab('pricing')}
          className={activeTab === 'pricing' ? 'active' : ''}
        >
          Pricing Suggestions ({pricingSuggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          className={activeTab === 'reorder' ? 'active' : ''}
        >
          Reorder Suggestions ({reorderSuggestions.length})
        </button>
      </div>

      <div>
        {activeTab === 'pricing' ? (
          <div>
            {pricingLoading ? (
              <div>Loading pricing suggestions...</div>
            ) : pricingError ? (
              <div>Error: {pricingError.message}</div>
            ) : (
              <div>
                {pricingSuggestions.map((suggestion) => (
                  <div key={suggestion._id} className="border p-4 mb-4 rounded">
                    <h3>{suggestion.product?.name || 'Unknown Product'}</h3>
                    <p>Current Price: ₹{suggestion.product?.currentPrice?.toFixed(2) || 'N/A'}</p>
                    <p>Suggested Price: ₹{suggestion.suggestedPrice?.toFixed(2) || 'N/A'}</p>
                    <p>Reason: {suggestion.triggerReason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {reorderLoading ? (
              <div>Loading reorder suggestions...</div>
            ) : reorderError ? (
              <div>Error: {reorderError.message}</div>
            ) : (
              <div>
                {reorderSuggestions.map((suggestion) => (
                  <div key={suggestion._id} className="border p-4 mb-4 rounded">
                    <h3>{suggestion.product?.name || 'Unknown Product'}</h3>
                    <p>Current Stock: {suggestion.product?.stockLevel || 'N/A'}</p>
                    <p>Suggested Order: {suggestion.suggestedQuantity || 'N/A'} units</p>
                    <p>Reason: {suggestion.triggerReason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionsPage;