import axios from 'axios';

class LLMService {
  constructor() {
    this.providers = {
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        key: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-2024-11-20'
      },
      anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        key: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022'
      },
      perplexity: {
        url: 'https://api.perplexity.ai/chat/completions',
        key: process.env.PERPLEXITY_API_KEY,
        model: 'sonar-pro'
      },
      gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        key: process.env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash'
      }
    };
  }

  async invoke(provider, prompt, options = {}) {
    const config = this.providers[provider.toLowerCase()];

    if (!config) {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    if (!config.key) {
      throw new Error(`API key not configured for ${provider}`);
    }

    try {
      let response;

      switch (provider.toLowerCase()) {
        case 'openai':
          response = await this.callOpenAI(prompt, config, options);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt, config, options);
          break;
        case 'perplexity':
          response = await this.callPerplexity(prompt, config, options);
          break;
        case 'gemini':
          response = await this.callGemini(prompt, config, options);
          break;
        default:
          throw new Error(`Handler not implemented for ${provider}`);
      }

      return {
        provider,
        model: config.model,
        prompt,
        response: response.text,
        usage: response.usage,
        citations: response.citations || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error calling ${provider}:`, error.message);
      throw new Error(`LLM API call failed for ${provider}: ${error.message}`);
    }
  }

  async callOpenAI(prompt, config, options) {
    const response = await axios.post(
      config.url,
      {
        model: options.model || config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // console.log(prompt, config, options, "params");
    console.log({
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
      citations: response.data.citations || []
    }, "openai response");

    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
      citations: response.data.citations || []
    };
  }

  async callAnthropic(prompt, config, options) {
    try {
      const response = await axios.post(
        config.url,
        {
          model: options.model || config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.max_tokens || 2000
        },
        {
          headers: {
            'x-api-key': config.key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        text: response.data.content[0].text,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('Anthropic API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async callPerplexity(prompt, config, options) {
    try {
      const response = await axios.post(
        config.url,
        {
          model: options.model || config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log({
        text: response.data.choices[0].message.content,
        usage: response.data.usage,
        citations: response.data.citations || []
      }, "perplexity response");

      return {
        text: response.data.choices[0].message.content,
        usage: response.data.usage,
        citations: response.data.citations || []
      };
    } catch (error) {
      console.error('Perplexity API Error Details:', error.response?.data || error.message);
      throw error;
    }
  }

  async callGemini(prompt, config, options) {
    try {
      const response = await axios.post(
        config.url,
        {
          model: options.model || config.model,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log({
        text: response.data.choices[0].message.content,
        usage: response.data.usage,
        citations: response.data.citations || []
      }, "gemini response");
      
      return {
        text: response.data.choices[0].message.content,
        usage: response.data.usage,
        citations: response.data.citations || []
      };
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Google Custom Search API
  async googleSearch(query) {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.log('⚠️ Google Search API not configured');
      return [];
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: query,
          num: 10
        }
      });

      const results = response.data.items || [];
      return results.map((item, index) => ({
        position: index + 1,
        title: item.title,
        link: item.link,
        snippet: item.snippet || ''
      }));
    } catch (error) {
      console.error('Google Search API Error:', error.response?.data?.error?.message || error.message);
      return [];
    }
  }

  // Batch invoke multiple prompts
  async batchInvoke(requests) {
    const promises = requests.map(req =>
      this.invoke(req.provider, req.prompt, req.options)
        .catch(err => ({ error: err.message, ...req }))
    );

    return await Promise.all(promises);
  }
}

export default new LLMService();
