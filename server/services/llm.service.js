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
        model: 'gemini-3.1-pro-preview'
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
    // Use OpenAI Responses API with web_search_preview for real citations
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model: options.model || config.model,
          tools: [{ type: 'web_search_preview' }],
          input: prompt
        },
        {
          headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract text and citations from the Responses API format
      const output = response.data.output || [];
      let text = '';
      const citations = [];

      for (const item of output) {
        if (item.type === 'message') {
          for (const content of (item.content || [])) {
            if (content.type === 'output_text') {
              text += content.text;
              // Extract inline citations/annotations
              for (const annotation of (content.annotations || [])) {
                if (annotation.type === 'url_citation' && annotation.url) {
                  citations.push(annotation.url);
                }
              }
            }
          }
        }
      }

      // Deduplicate citations
      const uniqueCitations = [...new Set(citations)];


      return {
        text: text || '',
        usage: response.data.usage,
        citations: uniqueCitations
      };
    } catch (error) {
      // Fallback to standard Chat Completions API if Responses API fails
      console.log('⚠️ OpenAI Responses API failed, falling back to Chat Completions:', error.response?.data?.error?.message || error.message);
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

      return {
        text: response.data.choices[0].message.content,
        usage: response.data.usage,
        citations: response.data.citations || []
      };
    }
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
      // Use Gemini's native API with Google Search grounding for real citations
      const nativeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.key}`;
      const response = await axios.post(
        nativeUrl,
        {
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const candidate = response.data.candidates?.[0];
      const text = candidate?.content?.parts?.map(p => p.text).join('') || '';
      
      // Extract grounding citations from Gemini's grounding metadata
      const citations = [];
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            citations.push(chunk.web.uri);
          }
        }
      }
      // Also check groundingSupports for additional URLs
      if (groundingMetadata?.groundingSupports) {
        for (const support of groundingMetadata.groundingSupports) {
          if (support.groundingChunkIndices) {
            // These reference the groundingChunks above, already collected
          }
        }
      }

      const uniqueCitations = [...new Set(citations)];
      
      return {
        text,
        usage: response.data.usageMetadata ? {
          prompt_tokens: response.data.usageMetadata.promptTokenCount,
          completion_tokens: response.data.usageMetadata.candidatesTokenCount,
          total_tokens: response.data.usageMetadata.totalTokenCount
        } : {},
        citations: uniqueCitations
      };
    } catch (error) {
      // Fallback to OpenAI-compatible endpoint without grounding
      console.log('⚠️ Gemini native API failed, falling back to OpenAI-compatible:', error.response?.data?.error?.message || error.message);
      try {
        const response = await axios.post(
          config.url,
          {
            model: config.model,
            messages: [{ role: 'user', content: prompt }]
          },
          {
            headers: {
              'Authorization': `Bearer ${config.key}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          text: response.data.choices[0].message.content,
          usage: response.data.usage,
          citations: response.data.citations || []
        };
      } catch (fallbackError) {
        console.error('Gemini API Error:', fallbackError.response?.data || fallbackError.message);
        throw fallbackError;
      }
    }
  }

  // Generate a Google AI Overview-style response using Gemini with Google Search grounding
  async generateAIOverview(searchQuery) {
    const geminiConfig = this.providers.gemini;

    if (!geminiConfig.key) {
      console.log('⚠️ Gemini API key not configured - skipping AI Overview generation');
      return null;
    }

    const normalizedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
    if (!normalizedQuery) {
      return { text: '', present: false, citations: [] };
    }

    try {
      const aiOverviewPrompt = `You are simulating a Google AI Overview. 
IMPORTANT: You MUST use the Google Search tool to look up real-time, up-to-date information for this query before answering. Do not rely solely on your internal training data.

Given the following search query, provide a concise, factual summary response similar to what Google AI Overviews would display at the top of search results. 

Keep the response brief (2-4 paragraphs), factual, and directly answering the query. Include specific product names, company names, and recommendations where relevant.

Search query: "${normalizedQuery}"`;

      const model = geminiConfig.model;
      const nativeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiConfig.key}`;


      const response = await axios.post(
        nativeUrl,
        {
          contents: [{ parts: [{ text: aiOverviewPrompt }] }],
          tools: [{ google_search: {} }],
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const candidate = response.data.candidates?.[0];

      const text = (candidate?.content?.parts || [])
        .map(p => p?.text)
        .filter(Boolean)
        .join('')
        .trim();

      // Extract grounding citations from Gemini's grounding metadata
      // The metadata structure can vary across API versions, so we check multiple paths
      const citations = [];
      const groundingMetadata = candidate?.groundingMetadata;

      // Path 1: groundingChunks[].web.uri (most common)
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            citations.push(chunk.web.uri);
          }
        }
      }

      // Path 2: groundingSupports[].segment may reference URLs directly
      if (groundingMetadata?.groundingSupports) {
        for (const support of groundingMetadata.groundingSupports) {
          if (support.segment?.uri) {
            citations.push(support.segment.uri);
          }
          // Some versions embed web references inside the support
          if (support.web?.uri) {
            citations.push(support.web.uri);
          }
        }
      }

      // Path 3: searchEntryPoint may contain rendered HTML with links
      if (groundingMetadata?.searchEntryPoint?.renderedContent) {
        const hrefRegex = /href="(https?:\/\/[^"]+)"/g;
        let match;
        while ((match = hrefRegex.exec(groundingMetadata.searchEntryPoint.renderedContent)) !== null) {
          citations.push(match[1]);
        }
      }

      const uniqueCitations = [...new Set(citations)];

      return {
        text,
        present: text.length > 0,
        citations: uniqueCitations
      };
    } catch (error) {
      console.error('[AI Overview] Generation error:', error.response?.data || error.message);
      if (error.response?.status) {
        console.error('[AI Overview] HTTP status:', error.response.status);
      }
      return null;
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
