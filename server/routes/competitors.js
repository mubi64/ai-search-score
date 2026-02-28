import express from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import llmService from '../services/llm.service.js';

const router = express.Router();

// Discover competitors
router.post('/discover', optionalAuth, async (req, res, next) => {
  try {
    const { companyName, industry, products } = req.body;

    console.log(`Discovering competitors for: ${companyName}`);

    try {
      const p = `Identify 10-15 top direct competitors for a company named "${companyName}" in the "${industry}" industry.
        Products: ${JSON.stringify(products)}.
        
        Return a JSON object with a key "competitors" containing an array of objects.
        Each object must have:
        - name: Competitor name
        - why: Brief reason why they are a competitor (max 100 chars)
        - domain: Estimated website domain (e.g. example.com)
        
        Return ONLY valid JSON.`;

      const provider = process.env.OPENAI_API_KEY ? 'openai' : 'perplexity';
      console.log(provider, "checking provider");
      
      const result = await llmService.invoke(provider, p, { temperature: 0.3 });

      let jsonStr = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);

      res.json({
        success: true,
        data: data
      });

    } catch (llmError) {
      console.warn("LLM competitor discovery failed, falling back to mock data", llmError);
      res.json({
        success: true,
        data: {
          competitors: [
            { name: "Competitor A", why: "Similar product offering", domain: "comp-a.com" },
            { name: "Competitor B", why: "Operates in same market", domain: "comp-b.com" },
            { name: "Competitor C", why: "Legacy alternative", domain: "comp-c.com" }
          ]
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

// Get competitors for a company
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      throw new AppError('company_id is required', 400);
    }

    const result = await query(
      'SELECT * FROM competitors WHERE company_id = $1 ORDER BY created_at',
      [company_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Create competitor
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { company_id, competitor_name, reason, is_active } = req.body;

    if (!company_id || !competitor_name) {
      throw new AppError('company_id and competitor_name are required', 400);
    }

    const result = await query(
      'INSERT INTO competitors (company_id, competitor_name, reason, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [company_id, competitor_name, reason || null, is_active !== undefined ? is_active : true]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete competitor
router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const result = await query('DELETE FROM competitors WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError('Competitor not found', 404);
    }

    res.json({
      success: true,
      message: 'Competitor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
