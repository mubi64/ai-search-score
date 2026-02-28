import express from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get topic analyses (with filtering)
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { report_id } = req.query;
        let sql = 'SELECT * FROM topic_analyses WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (report_id) {
            sql += ` AND report_id = $${paramCount++}`;
            params.push(report_id);
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// Get single topic analysis
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM topic_analyses WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            throw new AppError('Topic analysis not found', 404);
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// Create topic analysis
router.post('/', optionalAuth, async (req, res, next) => {
    try {
        const {
            report_id,
            topic,
            prompts_tested,
            chatgpt_mentions,
            chatgpt_positioning,
            chatgpt_sources,
            gemini_mentions,
            gemini_positioning,
            gemini_sources,
            perplexity_mentions,
            perplexity_positioning,
            perplexity_sources,
            google_ai_overview_mentions,
            google_ai_overview_positioning,
            google_ai_overview_sources,
            visibility_score,
            key_insights
        } = req.body;

        if (!report_id || !topic) {
            throw new AppError('report_id and topic are required', 400);
        }

        const result = await query(
            `INSERT INTO topic_analyses (
        report_id, topic, prompts_tested,
        chatgpt_mentions, chatgpt_positioning, chatgpt_sources,
        gemini_mentions, gemini_positioning, gemini_sources,
        perplexity_mentions, perplexity_positioning, perplexity_sources,
        google_ai_overview_mentions, google_ai_overview_positioning, google_ai_overview_sources,
        visibility_score, key_insights
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
            [
                report_id,
                topic,
                prompts_tested || [],
                chatgpt_mentions || 0,
                chatgpt_positioning,
                chatgpt_sources ? JSON.stringify(chatgpt_sources) : null,
                gemini_mentions || 0,
                gemini_positioning,
                gemini_sources ? JSON.stringify(gemini_sources) : null,
                perplexity_mentions || 0,
                perplexity_positioning,
                perplexity_sources ? JSON.stringify(perplexity_sources) : null,
                google_ai_overview_mentions || 0,
                google_ai_overview_positioning,
                google_ai_overview_sources ? JSON.stringify(google_ai_overview_sources) : null,
                visibility_score || 0,
                key_insights || []
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

// Update topic analysis
router.patch('/:id', optionalAuth, async (req, res, next) => {
    try {
        const {
            prompts_tested,
            chatgpt_mentions,
            chatgpt_positioning,
            chatgpt_sources,
            gemini_mentions,
            gemini_positioning,
            gemini_sources,
            perplexity_mentions,
            perplexity_positioning,
            perplexity_sources,
            google_ai_overview_mentions,
            google_ai_overview_positioning,
            google_ai_overview_sources,
            visibility_score,
            key_insights
        } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (prompts_tested !== undefined) {
            updates.push(`prompts_tested = $${paramCount++}`);
            values.push(prompts_tested);
        }
        if (chatgpt_mentions !== undefined) {
            updates.push(`chatgpt_mentions = $${paramCount++}`);
            values.push(chatgpt_mentions);
        }
        if (chatgpt_positioning !== undefined) {
            updates.push(`chatgpt_positioning = $${paramCount++}`);
            values.push(chatgpt_positioning);
        }
        if (chatgpt_sources !== undefined) {
            updates.push(`chatgpt_sources = $${paramCount++}`);
            values.push(JSON.stringify(chatgpt_sources));
        }
        if (gemini_mentions !== undefined) {
            updates.push(`gemini_mentions = $${paramCount++}`);
            values.push(gemini_mentions);
        }
        if (gemini_positioning !== undefined) {
            updates.push(`gemini_positioning = $${paramCount++}`);
            values.push(gemini_positioning);
        }
        if (gemini_sources !== undefined) {
            updates.push(`gemini_sources = $${paramCount++}`);
            values.push(JSON.stringify(gemini_sources));
        }
        if (perplexity_mentions !== undefined) {
            updates.push(`perplexity_mentions = $${paramCount++}`);
            values.push(perplexity_mentions);
        }
        if (perplexity_positioning !== undefined) {
            updates.push(`perplexity_positioning = $${paramCount++}`);
            values.push(perplexity_positioning);
        }
        if (perplexity_sources !== undefined) {
            updates.push(`perplexity_sources = $${paramCount++}`);
            values.push(JSON.stringify(perplexity_sources));
        }
        if (google_ai_overview_mentions !== undefined) {
            updates.push(`google_ai_overview_mentions = $${paramCount++}`);
            values.push(google_ai_overview_mentions);
        }
        if (google_ai_overview_positioning !== undefined) {
            updates.push(`google_ai_overview_positioning = $${paramCount++}`);
            values.push(google_ai_overview_positioning);
        }
        if (google_ai_overview_sources !== undefined) {
            updates.push(`google_ai_overview_sources = $${paramCount++}`);
            values.push(JSON.stringify(google_ai_overview_sources));
        }
        if (visibility_score !== undefined) {
            updates.push(`visibility_score = $${paramCount++}`);
            values.push(visibility_score);
        }
        if (key_insights !== undefined) {
            updates.push(`key_insights = $${paramCount++}`);
            values.push(key_insights);
        }

        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        values.push(req.params.id);
        const result = await query(
            `UPDATE topic_analyses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            throw new AppError('Topic analysis not found', 404);
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// Delete topic analysis
router.delete('/:id', optionalAuth, async (req, res, next) => {
    try {
        const result = await query('DELETE FROM topic_analyses WHERE id = $1 RETURNING id', [req.params.id]);

        if (result.rows.length === 0) {
            throw new AppError('Topic analysis not found', 404);
        }

        res.json({
            success: true,
            message: 'Topic analysis deleted'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
