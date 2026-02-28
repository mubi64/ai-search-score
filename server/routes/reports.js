import express from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get reports (with filtering)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { company_id, status, id } = req.query;
    let sql = `
      SELECT r.*, c.name as company_name, c.domain as company_domain
      FROM reports r
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (id) {
      sql += ` AND r.id = $${paramCount++}`;
      params.push(id);
    }
    if (company_id) {
      sql += ` AND r.company_id = $${paramCount++}`;
      params.push(company_id);
    }
    if (status) {
      sql += ` AND r.status = $${paramCount++}`;
      params.push(status);
    }

    sql += ' ORDER BY r.analysis_timestamp DESC';

    const result = await query(sql, params);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get single report
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM reports WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create report
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { company_id, topics_analyzed, status = 'pending' } = req.body;

    if (!company_id) {
      throw new AppError('company_id is required', 400);
    }

    // Get company name
    const companyResult = await query('SELECT name FROM companies WHERE id = $1', [company_id]);
    const companyName = companyResult.rows[0]?.name || null;

    const result = await query(
      `INSERT INTO reports (company_id, company_name, status, topics_analyzed)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [company_id, companyName, status, topics_analyzed || []]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update report
router.patch('/:id', optionalAuth, async (req, res, next) => {
  try {
    const {
      status,
      overall_visibility_score,
      total_mentions,
      chatgpt_visibility,
      gemini_visibility,
      perplexity_visibility,
      google_ai_overview_visibility,
      chatgpt_total_mentions,
      gemini_total_mentions,
      perplexity_total_mentions,
      google_ai_overview_total_mentions,
      competitor_scores,
      brands_tracked,
      error_message
    } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (overall_visibility_score !== undefined) {
      updates.push(`overall_visibility_score = $${paramCount++}`);
      values.push(overall_visibility_score);
    }
    if (total_mentions !== undefined) {
      updates.push(`total_mentions = $${paramCount++}`);
      values.push(total_mentions);
    }
    if (chatgpt_visibility !== undefined) {
      updates.push(`chatgpt_visibility = $${paramCount++}`);
      values.push(chatgpt_visibility);
    }
    if (gemini_visibility !== undefined) {
      updates.push(`gemini_visibility = $${paramCount++}`);
      values.push(gemini_visibility);
    }
    if (perplexity_visibility !== undefined) {
      updates.push(`perplexity_visibility = $${paramCount++}`);
      values.push(perplexity_visibility);
    }
    if (google_ai_overview_visibility !== undefined) {
      updates.push(`google_ai_overview_visibility = $${paramCount++}`);
      values.push(google_ai_overview_visibility);
    }
    if (chatgpt_total_mentions !== undefined) {
      updates.push(`chatgpt_total_mentions = $${paramCount++}`);
      values.push(chatgpt_total_mentions);
    }
    if (gemini_total_mentions !== undefined) {
      updates.push(`gemini_total_mentions = $${paramCount++}`);
      values.push(gemini_total_mentions);
    }
    if (perplexity_total_mentions !== undefined) {
      updates.push(`perplexity_total_mentions = $${paramCount++}`);
      values.push(perplexity_total_mentions);
    }
    if (google_ai_overview_total_mentions !== undefined) {
      updates.push(`google_ai_overview_total_mentions = $${paramCount++}`);
      values.push(google_ai_overview_total_mentions);
    }
    if (competitor_scores) {
      updates.push(`competitor_scores = $${paramCount++}`);
      values.push(JSON.stringify(competitor_scores));
    }
    if (brands_tracked) {
      updates.push(`brands_tracked = $${paramCount++}`);
      values.push(JSON.stringify(brands_tracked));
    }
    if (error_message !== undefined) {
      updates.push(`error_message = $${paramCount++}`);
      values.push(error_message);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE reports SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Get prompt results for a report
router.get('/:id/prompts', optionalAuth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM prompt_results WHERE report_id = $1 ORDER BY topic, created_at',
      [req.params.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Create prompt result
router.post('/:id/prompts', optionalAuth, async (req, res, next) => {
  try {
    const {
      topic,
      prompt,
      brand_mentions,
      chatgpt_response,
      gemini_response,
      perplexity_response,
      google_ai_overview_present,
      google_ai_overview_response,
      google_search_results,
      overall_score
    } = req.body;

    if (!topic || !prompt) {
      throw new AppError('topic and prompt are required', 400);
    }

    const result = await query(
      `INSERT INTO prompt_results 
       (report_id, topic, prompt, brand_mentions, chatgpt_response, gemini_response,
        perplexity_response, google_ai_overview_present, google_ai_overview_response,
        google_search_results, overall_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.params.id,
        topic,
        prompt,
        brand_mentions ? JSON.stringify(brand_mentions) : null,
        chatgpt_response,
        gemini_response,
        perplexity_response,
        google_ai_overview_present || false,
        google_ai_overview_response,
        google_search_results ? JSON.stringify(google_search_results) : null,
        overall_score || 0
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Export report as PDF
router.post('/:id/export-pdf', optionalAuth, async (req, res, next) => {
  try {
    const { jsPDF } = await import('jspdf');
    const reportId = req.params.id;

    // Fetch report with company info
    const reportResult = await query(`
      SELECT r.*, c.name as company_name, c.domain as company_domain
      FROM reports r
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE r.id = $1
    `, [reportId]);

    if (reportResult.rows.length === 0) {
      throw new AppError('Report not found', 404);
    }

    const report = reportResult.rows[0];

    // Fetch all related data
    const [topicAnalysesResult, promptsResult, allReportsResult] = await Promise.all([
      query('SELECT * FROM topic_analyses WHERE report_id = $1', [reportId]),
      query('SELECT * FROM prompt_results WHERE report_id = $1 ORDER BY topic, created_at', [reportId]),
      query('SELECT * FROM reports WHERE company_id = $1 AND status = $2 ORDER BY analysis_timestamp DESC', [report.company_id, 'completed'])
    ]);

    const topicAnalyses = topicAnalysesResult.rows;
    const promptResults = promptsResult.rows;
    const allCompanyReports = allReportsResult.rows;

    const doc = new jsPDF();

    // Helper function to clean text and handle special characters
    const cleanText = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/[\u2022]/g, '*')
        .replace(/[^\x20-\x7E]/g, '');
    };

    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper functions
    const addPage = () => {
      doc.addPage();
      y = margin;
    };

    const checkPageBreak = (requiredSpace = 20) => {
      if (y > pageHeight - margin - requiredSpace) {
        addPage();
      }
    };

    const addSectionHeader = (title, addSpaceBefore = true) => {
      if (addSpaceBefore) y += 10;
      checkPageBreak(20);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(cleanText(title), margin, y);
      y += 8;
      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
    };

    const addMetricBox = (label, value, x, width, color = [59, 130, 246]) => {
      doc.setFillColor(color[0], color[1], color[2], 0.1);
      doc.roundedRect(x, y, width, 30, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(cleanText(label), x + width / 2, y + 10, { align: 'center' });

      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(cleanText(String(value)), x + width / 2, y + 24, { align: 'center' });

      doc.setTextColor(0, 0, 0);
    };

    const reportDate = new Date(report.analysis_timestamp).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    // ============ COVER PAGE ============
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 80, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('AI Visibility Report', pageWidth / 2, 35, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont(undefined, 'normal');
    doc.text(cleanText(report.company_name || 'Company Report'), pageWidth / 2, 55, { align: 'center' });

    y = 100;
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Overall Visibility Score', pageWidth / 2, y, { align: 'center' });
    y += 20;

    const overallScore = parseFloat(report.overall_visibility_score) || 0;
    const scoreColor = overallScore >= 75 ? [34, 197, 94] :
      overallScore >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setFontSize(72);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(String(Math.round(overallScore)), pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Analysis Date: ${reportDate}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(cleanText(`Topics: ${(report.topics_analyzed || []).join(', ') || 'General'}`), pageWidth / 2, y, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    // ============ DASHBOARD OVERVIEW ============
    addPage();
    addSectionHeader('Dashboard Overview', false);

    // Calculate dashboard metrics
    const totalReports = allCompanyReports.length;
    const avgScore = totalReports > 0
      ? Math.round(allCompanyReports.reduce((sum, r) => sum + (parseFloat(r.overall_visibility_score) || 0), 0) / totalReports)
      : 0;
    const totalMentions = allCompanyReports.reduce((sum, r) => sum + (r.total_mentions || 0), 0);

    // Key Metrics Grid
    const boxWidth = (contentWidth - 10) / 3;
    addMetricBox('Total Reports', totalReports, margin, boxWidth, [99, 102, 241]);
    addMetricBox('Avg Score', avgScore, margin + boxWidth + 5, boxWidth, [20, 184, 166]);
    addMetricBox('Total Mentions', totalMentions, margin + (boxWidth + 5) * 2, boxWidth, [139, 92, 246]);
    y += 40;

    // Trend Analysis
    if (allCompanyReports.length > 1) {
      addSectionHeader('Visibility Trends');

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Recent performance across all reports:', margin, y);
      y += 8;

      const recentReports = allCompanyReports.slice(0, 10);

      // Table header
      doc.setFont(undefined, 'bold');
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.text('Date', margin + 2, y + 6);
      doc.text('Score', margin + 40, y + 6);
      doc.text('ChatGPT', margin + 65, y + 6);
      doc.text('Gemini', margin + 95, y + 6);
      doc.text('Perplexity', margin + 120, y + 6);
      doc.text('Google', margin + 150, y + 6);
      y += 10;

      // Table rows
      doc.setFont(undefined, 'normal');
      recentReports.forEach((r, index) => {
        checkPageBreak(8);

        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y - 5, contentWidth, 8, 'F');
        }

        const date = new Date(r.analysis_timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        doc.text(date, margin + 2, y);
        doc.text(String(Math.round(parseFloat(r.overall_visibility_score) || 0)), margin + 40, y);
        doc.text(String(Math.round(parseFloat(r.chatgpt_visibility) || 0)), margin + 65, y);
        doc.text(String(Math.round(parseFloat(r.gemini_visibility) || 0)), margin + 95, y);
        doc.text(String(Math.round(parseFloat(r.perplexity_visibility) || 0)), margin + 120, y);
        doc.text(r.google_ai_overview_visibility !== null ? String(Math.round(parseFloat(r.google_ai_overview_visibility))) : 'N/A', margin + 150, y);
        y += 8;
      });

      y += 5;

      // Performance insights
      if (allCompanyReports.length >= 2) {
        const currentIndex = allCompanyReports.findIndex(r => r.id == reportId);
        if (currentIndex > 0) {
          const previousReport = allCompanyReports[currentIndex - 1];
          const scoreDiff = Math.round((parseFloat(report.overall_visibility_score) || 0) - (parseFloat(previousReport.overall_visibility_score) || 0));
          const mentionsDiff = (report.total_mentions || 0) - (previousReport.total_mentions || 0);

          y += 5;
          doc.setFont(undefined, 'bold');
          doc.text('Performance vs Previous Report:', margin, y);
          y += 6;
          doc.setFont(undefined, 'normal');

          doc.text('Score Change: ', margin + 5, y);
          doc.setTextColor(scoreDiff >= 0 ? 34 : 239, scoreDiff >= 0 ? 197 : 68, scoreDiff >= 0 ? 94 : 68);
          doc.text(`${scoreDiff >= 0 ? '+' : ''}${scoreDiff} points`, margin + 35, y);
          doc.setTextColor(0, 0, 0);
          y += 6;

          doc.text('Mentions Change: ', margin + 5, y);
          doc.setTextColor(mentionsDiff >= 0 ? 34 : 239, mentionsDiff >= 0 ? 197 : 68, mentionsDiff >= 0 ? 94 : 68);
          doc.text(`${mentionsDiff >= 0 ? '+' : ''}${mentionsDiff} mentions`, margin + 40, y);
          doc.setTextColor(0, 0, 0);
        }
      }
    }

    // ============ CURRENT REPORT DETAILS ============
    addPage();
    addSectionHeader('Current Report Analysis', false);

    // Platform Performance
    const boxWidth2 = (contentWidth - 15) / 4;
    addMetricBox('Overall', Math.round(overallScore), margin, boxWidth2, scoreColor);
    addMetricBox('ChatGPT', Math.round(parseFloat(report.chatgpt_visibility) || 0), margin + boxWidth2 + 5, boxWidth2, [139, 92, 246]);
    addMetricBox('Gemini', Math.round(parseFloat(report.gemini_visibility) || 0), margin + (boxWidth2 + 5) * 2, boxWidth2, [20, 184, 166]);
    addMetricBox('Perplexity', Math.round(parseFloat(report.perplexity_visibility) || 0), margin + (boxWidth2 + 5) * 3, boxWidth2, [99, 102, 241]);
    y += 40;

    // Platform Breakdown Details
    addSectionHeader('Platform Performance Details');

    const platforms = [
      { name: 'ChatGPT', score: report.chatgpt_visibility, mentions: report.chatgpt_total_mentions || 0 },
      { name: 'Gemini', score: report.gemini_visibility, mentions: report.gemini_total_mentions || 0 },
      { name: 'Perplexity', score: report.perplexity_visibility, mentions: report.perplexity_total_mentions || 0 },
      {
        name: 'Google AI Overview',
        score: report.google_ai_overview_visibility,
        mentions: report.google_ai_overview_total_mentions || 0,
        isNull: report.google_ai_overview_visibility === null
      }
    ];

    platforms.forEach(platform => {
      checkPageBreak(20);

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(cleanText(platform.name), margin, y);

      doc.setFont(undefined, 'normal');
      const scoreText = platform.isNull ? 'N/A' : `${Math.round(parseFloat(platform.score) || 0)}/100`;
      doc.text(`${scoreText} | ${platform.mentions} mentions`, pageWidth - margin, y, { align: 'right' });
      y += 5;

      if (!platform.isNull) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, y, contentWidth, 6, 2, 2, 'S');

        const barWidth = ((parseFloat(platform.score) || 0) / 100) * contentWidth;
        const barColor = (parseFloat(platform.score) || 0) >= 75 ? [34, 197, 94] :
          (parseFloat(platform.score) || 0) >= 50 ? [234, 179, 8] : [239, 68, 68];
        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.roundedRect(margin, y, barWidth, 6, 2, 2, 'F');
      }

      y += 12;
    });

    // ============ TOPIC ANALYSIS ============
    if (topicAnalyses.length > 0) {
      addPage();
      addSectionHeader('Topic Analysis', false);

      topicAnalyses.forEach((analysis, index) => {
        if (index > 0) checkPageBreak(70);

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(cleanText(analysis.topic), margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        doc.text(`Visibility Score: ${analysis.visibility_score}/100`, margin, y);
        y += 8;

        // Platform details in a compact format
        doc.setFontSize(9);
        doc.text(`ChatGPT: ${analysis.chatgpt_mentions || 0} mentions - ${cleanText(analysis.chatgpt_positioning || 'Not mentioned')}`, margin + 5, y);
        y += 5;
        doc.text(`Gemini: ${analysis.gemini_mentions || 0} mentions - ${cleanText(analysis.gemini_positioning || 'Not mentioned')}`, margin + 5, y);
        y += 5;
        doc.text(`Perplexity: ${analysis.perplexity_mentions || 0} mentions - ${cleanText(analysis.perplexity_positioning || 'Not mentioned')}`, margin + 5, y);
        y += 5;
        doc.text(`Google AI: ${analysis.google_ai_overview_mentions || 0} mentions - ${cleanText(analysis.google_ai_overview_positioning || 'Not mentioned')}`, margin + 5, y);
        y += 8;

        if (analysis.key_insights && analysis.key_insights.length > 0) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text('Key Insights:', margin, y);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          y += 6;

          analysis.key_insights.forEach(insight => {
            checkPageBreak(10);
            const lines = doc.splitTextToSize(cleanText(`* ${insight}`), contentWidth - 10);
            doc.text(lines, margin + 5, y);
            y += lines.length * 5;
          });
        }

        y += 10;
      });
    }

    // ============ PROMPT PERFORMANCE ============
    addPage();
    addSectionHeader('Top Performing Prompts', false);

    const topPrompts = promptResults
      .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
      .slice(0, 15);

    topPrompts.forEach((result, index) => {
      checkPageBreak(25);

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. Score: ${result.overall_score || 0}`, margin, y);
      y += 5;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const promptLines = doc.splitTextToSize(cleanText(result.prompt), contentWidth - 10);
      doc.text(promptLines, margin + 5, y);
      y += promptLines.length * 4.5 + 2;

      const mentions = [];
      if (result.brand_mentions?.chatgpt?.length > 0) mentions.push('ChatGPT');
      if (result.brand_mentions?.gemini?.length > 0) mentions.push('Gemini');
      if (result.brand_mentions?.perplexity?.length > 0) mentions.push('Perplexity');
      if (result.brand_mentions?.google_ai_overview?.length > 0) mentions.push('Google AI');

      if (mentions.length > 0) {
        doc.setTextColor(34, 197, 94);
        doc.text(`Mentioned in: ${mentions.join(', ')}`, margin + 5, y);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('No mentions', margin + 5, y);
      }
      doc.setTextColor(0, 0, 0);
      y += 10;
    });

    // ============ COMPETITIVE LANDSCAPE ============
    if (report.competitor_scores && Object.keys(report.competitor_scores).length > 0) {
      addPage();
      addSectionHeader('Competitive Landscape', false);

      const sortedCompetitors = Object.entries(report.competitor_scores)
        .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
        .slice(0, 20);

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Top brands mentioned across all AI responses:', margin, y);
      y += 10;

      sortedCompetitors.forEach(([brand, data], index) => {
        checkPageBreak(12);

        const isTarget = brand.toLowerCase() === (report.company_name || '').toLowerCase();

        if (isTarget) {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(59, 130, 246);
        } else {
          doc.setFont(undefined, 'normal');
          doc.setTextColor(0, 0, 0);
        }

        doc.text(`${index + 1}. ${cleanText(brand)}`, margin, y);
        doc.text(`${data.mentions || 0} mentions`, pageWidth - margin, y, { align: 'right' });

        y += 4;
        const maxMentions = sortedCompetitors[0][1].mentions || 1;
        const barWidth = ((data.mentions || 0) / maxMentions) * (contentWidth - 40);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, contentWidth - 40, 4);

        if (isTarget) {
          doc.setFillColor(59, 130, 246);
        } else {
          doc.setFillColor(203, 213, 225);
        }
        doc.rect(margin, y, barWidth, 4, 'F');

        y += 10;
        doc.setTextColor(0, 0, 0);
      });
    }

    // ============ TOP SOURCES ============
    addPage();
    addSectionHeader('Top Sources Cited', false);

    const allSources = {};
    topicAnalyses.forEach(analysis => {
      ['chatgpt_sources', 'gemini_sources', 'perplexity_sources', 'google_ai_overview_sources'].forEach(sourceType => {
        const sources = analysis[sourceType] || {};
        Object.entries(sources).forEach(([sourceName, urls]) => {
          if (!allSources[sourceName]) {
            allSources[sourceName] = 0;
          }
          const urlArray = Array.isArray(urls) ? urls : (urls ? [urls] : []);
          allSources[sourceName] += urlArray.length;
        });
      });
    });

    const sortedSources = Object.entries(allSources)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    sortedSources.forEach(([source, count]) => {
      checkPageBreak(8);
      doc.text(cleanText(source), margin, y);
      doc.text(`${count} citations`, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });

    if (sortedSources.length === 0) {
      doc.setTextColor(100, 116, 139);
      doc.text('No sources were cited in this analysis', margin, y);
      doc.setTextColor(0, 0, 0);
    }

    // ============ FOOTER ON ALL PAGES ============
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Generated by AI Visibility Intelligence | ${reportDate}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ai-visibility-report-${(report.company_name || 'report').replace(/\s+/g, '-')}-${new Date(report.analysis_timestamp).toISOString().split('T')[0]}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    next(error);
  }
});

export default router;
