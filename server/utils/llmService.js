const axios = require('axios');

class LLMService {
  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || 'https://litellm-qc.zycus.net/v1/chat/completions';
    this.apiKey = process.env.LLM_API_KEY || 'dummy-key';
    this.model = process.env.LLM_MODEL || 'qwen-cursor';
    this.product = process.env.LLM_PRODUCT || 'PC1';
  }

  async callLLM(prompt) {
    try {
      const response = await axios.post(this.baseUrl, {
        model: this.model,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'product': this.product
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM API Error:', error.message);
      throw new Error('Failed to get response from LLM API');
    }
  }
}

module.exports = new LLMService();