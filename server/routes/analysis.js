import express from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import llmService from '../services/llm.service.js';
import { extractSources, mergeSources } from '../utils/sourceExtractor.js';

const router = express.Router();

// Run analysis for a company
router.post('/run', optionalAuth, async (req, res, next) => {
  try {
    const { company_id, report_id, topics, prompts_by_topic } = req.body;

    if (!company_id || !prompts_by_topic) {
      throw new AppError('company_id and prompts_by_topic are required', 400);
    }

    // Get company info
    const companyResult = await query('SELECT * FROM companies WHERE id = $1', [company_id]);
    if (companyResult.rows.length === 0) {
      throw new AppError('Company not found', 404);
    }
    const company = companyResult.rows[0];

    // Fetch competitors from database
    const competitorsResult = await query('SELECT * FROM competitors WHERE company_id = $1', [company_id]);
    const competitors = competitorsResult.rows;

    let report;

    // If a report_id was provided by frontend, use that report
    if (report_id) {
      const existingReportResult = await query('SELECT * FROM reports WHERE id = $1', [report_id]);
      if (existingReportResult.rows.length > 0) {
        report = existingReportResult.rows[0];
        // Update the report status to processing
        await query('UPDATE reports SET status = $1, topics_analyzed = $2 WHERE id = $3', ['processing', topics || [], report_id]);
        report.status = 'processing';
        report.topics_analyzed = topics || [];
      }
    }

    // If no valid report found/provided, create a new one
    if (!report) {
      const reportResult = await query(
        'INSERT INTO reports (company_id, company_name, status, topics_analyzed) VALUES ($1, $2, $3, $4) RETURNING *',
        [company_id, company.name, 'processing', topics || []]
      );
      report = reportResult.rows[0];
    }

    // Start analysis asynchronously (don't wait)
    runAnalysisAsync(report.id, company, prompts_by_topic, competitors);

    res.json({
      success: true,
      message: 'Analysis started',
      report_id: report.id,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// Get analysis progress
router.get('/progress/:report_id', optionalAuth, async (req, res, next) => {
  try {
    const reportResult = await query('SELECT * FROM reports WHERE id = $1', [req.params.report_id]);

    if (reportResult.rows.length === 0) {
      throw new AppError('Report not found', 404);
    }

    const report = reportResult.rows[0];

    const completed = parseInt(report.completed_prompts) || 0;
    const total = parseInt(report.total_prompts) || 0;

    res.json({
      success: true,
      report_id: report.id,
      status: report.status,
      progress: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      },
      scores: {
        overall: report.overall_visibility_score,
        chatgpt: report.chatgpt_visibility,
        gemini: report.gemini_visibility,
        perplexity: report.perplexity_visibility,
        google_ai_overview: report.google_ai_overview_visibility
      },
      mentions: {
        total: report.total_mentions,
        chatgpt: report.chatgpt_total_mentions,
        gemini: report.gemini_total_mentions,
        perplexity: report.perplexity_total_mentions,
        google_ai_overview: report.google_ai_overview_total_mentions
      }
    });
  } catch (error) {
    next(error);
  }
});

// Invoke LLM directly (for testing)
router.post('/invoke-llm', optionalAuth, async (req, res, next) => {
  try {
    const { provider, prompt, options } = req.body;

    if (!provider || !prompt) {
      throw new AppError('provider and prompt are required', 400);
    }

    const result = await llmService.invoke(provider, prompt, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Generate prompts using LLM
router.post('/generate-prompts', optionalAuth, async (req, res, next) => {
  try {
    const { companyName, topic, count, products } = req.body;

    if (!companyName || !topic) {
      throw new AppError('companyName and topic are required', 400);
    }


    try {
      let promptGenerationPrompt;

      // Special handling for General Company Presence
      if (topic === 'General Company Presence' && products && products.length > 0) {
        promptGenerationPrompt = `Generate ${count} realistic, specific questions that potential customers with genuine buying intent might ask an AI assistant when researching solutions related to a company that offers: ${products.join(', ')}.

IMPORTANT: Do NOT mention any specific company names, brands, or competitors in these questions. These should be general discovery questions from buyers who don't yet know which brands to consider.

The questions should represent diverse buyer personas exploring solutions across these different product/service areas:
${products.map(p => `- ${p}`).join('\n')}

Create questions that:
- Cover different aspects of these products/services
- Represent various use cases and industries
- Show different budget levels and priorities
- Range from beginner to expert perspectives
- Address specific technical requirements or feature needs
- Consider quality, price, reliability, and long-term value

Examples of good question patterns:
- "What features should I look for in [product category] for [specific use case]?"
- "I need [product type] that can handle [specific requirement], what are my options?"
- "What's the most reliable [product category] for [specific situation]?"
- "I'm looking for [product type] with [specific features], what should I consider?"
- "What are the key differences between [product type A] and [product type B]?"
- "I have a budget of [range] for [product category], what can I get?"

Each question should sound like it's from a real person with a specific need who is genuinely trying to discover which brands/solutions exist in this space.

Return ONLY valid JSON with a "prompts" key containing an array of exactly ${count} strings.`;
      } else {
        // Standard topic-specific prompt generation
        promptGenerationPrompt = `Generate ${count} realistic, specific questions that potential customers with genuine buying intent might ask an AI assistant when researching "${topic}".

IMPORTANT: Do NOT mention any specific company names, brands, or competitors in these questions. These should be general discovery questions from buyers who don't yet know which brands to consider.

The questions should represent diverse buyer personas with specific needs and wants, such as:
- "What features should I look for in [product category] for [specific use case]?"
- "I need [product type] that can handle [specific requirement], what are my options?"
- "What's the most reliable [product category] for [specific situation]?"
- "I'm looking for [product type] with [specific features], what should I consider?"
- "What are the key differences between [product type A] and [product type B]?"
- "I have a budget of [range] for [product category], what can I get?"

Make them diverse, covering different buyer perspectives:
- Different use cases and industries
- Various budget levels and priorities
- Different experience levels (beginners vs. experts)
- Specific technical requirements
- Quality vs. price considerations
- Long-term value and reliability concerns

Each question should sound like it's from a real person with a specific need who is genuinely trying to discover which brands/solutions exist.

Return ONLY valid JSON with a "prompts" key containing an array of exactly ${count} strings.`;
      }

      const provider = process.env.OPENAI_API_KEY ? 'openai' : 'perplexity';
      const result = await llmService.invoke(provider, promptGenerationPrompt, { temperature: 0.7 });

      // Clean markdown code blocks if any
      let jsonStr = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);

      res.json({
        success: true,
        data: {
          prompts: data.prompts || []
        }
      });

    } catch (llmError) {
      console.warn("LLM prompt generation failed, falling back to template prompts", llmError);

      // Fallback to template-based prompts
      const templates = [
        `What do you know about ${companyName}?`,
        `Tell me about ${companyName}'s products`,
        `How does ${companyName} compare to competitors?`,
        `What are the reviews for ${companyName}?`,
        `Is ${companyName} a good choice for ${topic.toLowerCase()}?`
      ];

      res.json({
        success: true,
        data: {
          prompts: templates.slice(0, count)
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

// Get max prompts configuration
router.get('/max-prompts', optionalAuth, async (req, res, next) => {
  try {
    const maxPrompts = parseInt(process.env.MAX_PROMPTS) || 20;

    res.json({
      success: true,
      data: {
        maxPrompts
      }
    });
  } catch (error) {
    next(error);
  }
});


// Helper function to convert Perplexity citations to sources format
function convertCitationsToSources(citations) {
  const sources = {};
  citations.forEach(url => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      const domainParts = domain.split('.');
      const domainName = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domainParts[0];
      const formattedName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

      if (!sources[formattedName]) {
        sources[formattedName] = [];
      }
      sources[formattedName].push({
        url: url,
        context: `Citation from ${domain}`
      });
    } catch (e) {
      console.error('Invalid citation URL:', url);
    }
  });
  return sources;
}

// Async function to run analysis in background
async function runAnalysisAsync(reportId, company, promptsByTopic, competitors) {
  try {
    const totalPrompts = Object.values(promptsByTopic).reduce((sum, prompts) => sum + prompts.length, 0);

    // Store total_prompts on the report so progress endpoint can track it
    await query(
      'UPDATE reports SET total_prompts = $1, completed_prompts = 0, debug_log = array_append(debug_log, $2) WHERE id = $3',
      [totalPrompts, `Total prompts to process: ${totalPrompts}`, reportId]
    );

    // Check which providers are available (have API keys configured)
    const availableProviders = [];

    if (process.env.OPENAI_API_KEY) {
      availableProviders.push('openai');
    } else {
      console.warn('⚠️ OpenAI API key not configured - skipping');
    }

    if (process.env.PERPLEXITY_API_KEY) {
      availableProviders.push('perplexity');
    } else {
      console.warn('⚠️ Perplexity API key not configured - skipping');
    }

    if (process.env.GEMINI_API_KEY) {
      availableProviders.push('gemini');
    } else {
      console.warn('⚠️ Gemini API key not configured - skipping');
    }

    if (availableProviders.length === 0) {
      console.error('❌ No AI providers configured! Add API keys to server/.env');
      await query(
        'UPDATE reports SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', 'No AI providers configured. Please add API keys.', reportId]
      );
      return;
    }


    // Track per-platform stats
    const platformStats = {
      openai: { total: 0, mentions: 0 },
      perplexity: { total: 0, mentions: 0 },
      gemini: { total: 0, mentions: 0 },
      google: { total: 0, mentions: 0 }
    };

    // Track competitor mentions
    const competitorStats = {};

    if (competitors && competitors.length > 0) {
      competitors.forEach(comp => {
        const compId = comp.id || comp.competitor_id;
        const compName = comp.name || comp.competitor_name;
        if (compId && compName) {
          competitorStats[compId] = {
            competitor_id: compId,
            competitor_name: compName,
            total_mentions: 0,
            chatgpt_mentions: 0,
            gemini_mentions: 0,
            perplexity_mentions: 0,
            overall_score: 0
          };
        }
      });
    }

    let totalMentions = 0;

    // Process each topic and prompt
    for (const [topic, prompts] of Object.entries(promptsByTopic)) {
      // Track per-topic data for topic_analyses
      const topicData = {
        chatgpt_mentions: 0,
        chatgpt_sources: {},
        gemini_mentions: 0,
        gemini_sources: {},
        perplexity_mentions: 0,
        perplexity_sources: {},
        google_ai_overview_mentions: 0,
        google_ai_overview_sources: {},
        prompts_tested: []
      };

      for (const promptText of prompts) {
        topicData.prompts_tested.push(promptText);

        // Initialize result object for this prompt
        const promptResult = {
          report_id: reportId,
          topic: topic,
          prompt: promptText,
          brand_mentions: {
            chatgpt: [],
            gemini: [],
            perplexity: [],
            google_ai_overview: []
          },
          chatgpt_response: null,
          gemini_response: null,
          perplexity_response: null,
          google_ai_overview_present: false,
          google_ai_overview_response: null,
          google_search_results: [],
          overall_score: 0
        };

        // Generate Google AI Overview-style response
        if (process.env.GEMINI_API_KEY) {
          try {
            const aiOverviewResult = await llmService.generateAIOverview(promptText);
            if (aiOverviewResult && aiOverviewResult.present) {
              promptResult.google_ai_overview_present = true;
              promptResult.google_ai_overview_response = aiOverviewResult.text;

              // Check if brand is mentioned in AI Overview
              const aiOverviewText = aiOverviewResult.text.toLowerCase();
              const brandMentionedInOverview = aiOverviewText.includes(company.name.toLowerCase()) ||
                aiOverviewText.includes(company.domain.toLowerCase());

              if (brandMentionedInOverview) {
                promptResult.brand_mentions.google_ai_overview.push(company.id.toString());
                platformStats.google.total++;
                platformStats.google.mentions++;
                topicData.google_ai_overview_mentions++;
                totalMentions++;
              } else {
                platformStats.google.total++;
              }

              // Use grounding citations from Google Search if available, fallback to text extraction
              const aiOverviewSources = aiOverviewResult.citations && aiOverviewResult.citations.length > 0
                ? convertCitationsToSources(aiOverviewResult.citations)
                : extractSources(aiOverviewResult.text);
              topicData.google_ai_overview_sources = mergeSources(topicData.google_ai_overview_sources, aiOverviewSources);

              // Check competitor mentions in AI Overview
              Object.keys(competitorStats).forEach(compId => {
                const compName = competitorStats[compId].competitor_name;
                if (aiOverviewText.includes(compName.toLowerCase())) {
                  competitorStats[compId].total_mentions++;
                }
              });

            }
          } catch (error) {
            console.error(`❌ AI Overview generation failed: ${error.message}`);
          }
        }

        // Call all available providers IN PARALLEL for speed
        const promptWithSources = `${promptText}\n\nPlease include relevant source URLs (full https:// links) to back up your recommendations and claims where possible.`;

        const providerPromises = availableProviders.map(async (provider) => {
          try {
            const result = await llmService.invoke(provider, promptWithSources);
            return { provider, result, error: null };
          } catch (error) {
            console.error(`❌ Error processing ${provider}: ${error.message}`);
            return { provider, result: null, error };
          }
        });

        const providerResults = await Promise.all(providerPromises);

        // Process results from all providers
        for (const { provider, result, error } of providerResults) {
          if (error || !result) {
            // Track as failed attempt
            if (provider === 'openai') platformStats.openai.total++;
            else if (provider === 'perplexity') platformStats.perplexity.total++;
            else if (provider === 'gemini') platformStats.gemini.total++;
            continue;
          }

          const brandMentioned = result.response.toLowerCase().includes(company.name.toLowerCase()) ||
            result.response.toLowerCase().includes(company.domain.toLowerCase());
          const responseSources = extractSources(result.response);

          if (provider === 'openai') {
            promptResult.chatgpt_response = result.response;
            platformStats.openai.total++;
            const openaiSources = result.citations && result.citations.length > 0
              ? convertCitationsToSources(result.citations)
              : responseSources;
            topicData.chatgpt_sources = mergeSources(topicData.chatgpt_sources, openaiSources);
            if (brandMentioned) {
              promptResult.brand_mentions.chatgpt.push(company.id.toString());
              platformStats.openai.mentions++;
              topicData.chatgpt_mentions++;
              totalMentions++;
            }
            Object.keys(competitorStats).forEach(compId => {
              const compName = competitorStats[compId].competitor_name;
              if (result.response.toLowerCase().includes(compName.toLowerCase())) {
                competitorStats[compId].chatgpt_mentions++;
                competitorStats[compId].total_mentions++;
              }
            });
          } else if (provider === 'perplexity') {
            promptResult.perplexity_response = result.response;
            platformStats.perplexity.total++;
            const perplexitySources = result.citations && result.citations.length > 0
              ? convertCitationsToSources(result.citations)
              : responseSources;
            topicData.perplexity_sources = mergeSources(topicData.perplexity_sources, perplexitySources);
            if (brandMentioned) {
              promptResult.brand_mentions.perplexity.push(company.id.toString());
              platformStats.perplexity.mentions++;
              topicData.perplexity_mentions++;
              totalMentions++;
            }
            Object.keys(competitorStats).forEach(compId => {
              const compName = competitorStats[compId].competitor_name;
              if (result.response.toLowerCase().includes(compName.toLowerCase())) {
                competitorStats[compId].perplexity_mentions++;
                competitorStats[compId].total_mentions++;
              }
            });
          } else if (provider === 'gemini') {
            promptResult.gemini_response = result.response;
            platformStats.gemini.total++;
            const geminiSources = result.citations && result.citations.length > 0
              ? convertCitationsToSources(result.citations)
              : responseSources;
            topicData.gemini_sources = mergeSources(topicData.gemini_sources, geminiSources);
            if (brandMentioned) {
              promptResult.brand_mentions.gemini.push(company.id.toString());
              platformStats.gemini.mentions++;
              topicData.gemini_mentions++;
              totalMentions++;
            }
            Object.keys(competitorStats).forEach(compId => {
              const compName = competitorStats[compId].competitor_name;
              if (result.response.toLowerCase().includes(compName.toLowerCase())) {
                competitorStats[compId].gemini_mentions++;
                competitorStats[compId].total_mentions++;
              }
            });
          }
        }

        // Calculate overall score for this prompt
        const responsesWithMentions = [
          promptResult.brand_mentions.chatgpt.length > 0,
          promptResult.brand_mentions.gemini.length > 0,
          promptResult.brand_mentions.perplexity.length > 0,
          promptResult.brand_mentions.google_ai_overview.length > 0
        ].filter(Boolean).length;

        const totalResponses = [
          promptResult.chatgpt_response,
          promptResult.gemini_response,
          promptResult.perplexity_response,
          promptResult.google_ai_overview_response
        ].filter(Boolean).length;

        promptResult.overall_score = totalResponses > 0
          ? Math.round((responsesWithMentions / totalResponses) * 100)
          : 0;

        // Insert the prompt result
        await query(
          `INSERT INTO prompt_results 
           (report_id, topic, prompt, brand_mentions, chatgpt_response, gemini_response, 
            perplexity_response, google_ai_overview_present, google_ai_overview_response, 
            google_search_results, overall_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            promptResult.report_id,
            promptResult.topic,
            promptResult.prompt,
            JSON.stringify(promptResult.brand_mentions),
            promptResult.chatgpt_response,
            promptResult.gemini_response,
            promptResult.perplexity_response,
            promptResult.google_ai_overview_present,
            promptResult.google_ai_overview_response,
            JSON.stringify(promptResult.google_search_results),
            promptResult.overall_score
          ]
        );

        // Increment completed_prompts counter for real-time progress tracking
        await query(
          'UPDATE reports SET completed_prompts = completed_prompts + 1 WHERE id = $1',
          [reportId]
        );
      }

      // Calculate topic visibility score
      const topicTotalMentions = topicData.chatgpt_mentions + topicData.gemini_mentions +
        topicData.perplexity_mentions + topicData.google_ai_overview_mentions;
      const topicTotalPrompts = prompts.length * availableProviders.length;
      const topicVisibility = topicTotalPrompts > 0
        ? Math.round((topicTotalMentions / topicTotalPrompts) * 100)
        : 0;

      // Insert topic analysis record
      await query(
        `INSERT INTO topic_analyses 
         (report_id, topic, prompts_tested, 
          chatgpt_mentions, chatgpt_sources, 
          gemini_mentions, gemini_sources,
          perplexity_mentions, perplexity_sources,
          google_ai_overview_mentions, google_ai_overview_sources,
          visibility_score, key_insights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          reportId,
          topic,
          topicData.prompts_tested,
          topicData.chatgpt_mentions,
          JSON.stringify(topicData.chatgpt_sources),
          topicData.gemini_mentions,
          JSON.stringify(topicData.gemini_sources),
          topicData.perplexity_mentions,
          JSON.stringify(topicData.perplexity_sources),
          topicData.google_ai_overview_mentions,
          JSON.stringify(topicData.google_ai_overview_sources),
          topicVisibility,
          [] // key_insights can be generated later if needed
        ]
      );

      
    }

    // Calculate per-platform visibility scores
    const chatgptVisibility = platformStats.openai.total > 0
      ? (platformStats.openai.mentions / platformStats.openai.total) * 100
      : 0;
    const perplexityVisibility = platformStats.perplexity.total > 0
      ? (platformStats.perplexity.mentions / platformStats.perplexity.total) * 100
      : 0;
    const geminiVisibility = platformStats.gemini.total > 0
      ? (platformStats.gemini.mentions / platformStats.gemini.total) * 100
      : 0;
    const googleAIOverviewVisibility = platformStats.google.total > 0
      ? (platformStats.google.mentions / platformStats.google.total) * 100
      : null;

    // Overall visibility is average of all platforms that were tested
    const allPlatformScores = [chatgptVisibility, perplexityVisibility, geminiVisibility];
    const allPlatformTotals = [platformStats.openai.total, platformStats.perplexity.total, platformStats.gemini.total];
    // Include Google AI Overview in overall score if it was tested
    if (platformStats.google.total > 0) {
      allPlatformScores.push(googleAIOverviewVisibility);
      allPlatformTotals.push(platformStats.google.total);
    }
    const testedPlatforms = allPlatformScores.filter((_, i) => allPlatformTotals[i] > 0);
    const overallScore = testedPlatforms.length > 0
      ? testedPlatforms.reduce((a, b) => a + b, 0) / testedPlatforms.length
      : 0;


    // Calculate competitor scores
    const totalPromptCount = Object.values(promptsByTopic).reduce((sum, p) => sum + p.length, 0) * availableProviders.length;
    Object.keys(competitorStats).forEach(compId => {
      const mentions = competitorStats[compId].total_mentions;
      competitorStats[compId].overall_score = totalPromptCount > 0
        ? Math.round((mentions / totalPromptCount) * 100)
        : 0;
    });

    // Convert competitor stats to array format for storage
    const competitorScoresArray = Object.values(competitorStats);

    // Update report with final results
    await query(
      `UPDATE reports 
       SET status = 'completed', 
           overall_visibility_score = $1, 
           total_mentions = $2,
           chatgpt_visibility = $3,
           perplexity_visibility = $4,
           gemini_visibility = $5,
           chatgpt_total_mentions = $6,
           perplexity_total_mentions = $7,
           gemini_total_mentions = $8,
           google_ai_overview_visibility = $9,
           google_ai_overview_total_mentions = $10,
           competitor_scores = $11,
           analysis_timestamp = NOW()
       WHERE id = $12`,
      [overallScore, totalMentions, chatgptVisibility, perplexityVisibility, geminiVisibility,
        platformStats.openai.mentions, platformStats.perplexity.mentions, platformStats.gemini.mentions,
        googleAIOverviewVisibility, platformStats.google.mentions,
        JSON.stringify(competitorScoresArray), reportId]
    );

  } catch (error) {
    console.error(`❌ Analysis failed for report ${reportId}:`, error);

    // Mark report as failed
    await query(
      'UPDATE reports SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, reportId]
    );
  }
}

export default router;
