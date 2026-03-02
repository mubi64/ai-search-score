import express from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Admin password (in production, use environment variable and proper hashing)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Verify admin password
router.post('/verify-password', async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password) {
            throw new AppError('Password is required', 400);
        }

        // console.log("admin password checking", ADMIN_PASSWORD, password);
        

        const isValid = password === ADMIN_PASSWORD;

        res.json({
            success: isValid,
            data: { success: isValid }
        });
    } catch (error) {
        next(error);
    }
});

// Get admin dashboard data
router.get('/data', optionalAuth, async (req, res, next) => {
    try {
        // Get all users with their submission stats
        const usersResult = await query(`
      SELECT 
        u.email,
        u.created_at as first_submission,
        COUNT(DISTINCT es.id) as submission_count,
        MAX(es.submission_timestamp) as last_submission,
        (SELECT domain FROM email_submissions WHERE email = u.email ORDER BY submission_timestamp DESC LIMIT 1) as domain
      FROM users u
      LEFT JOIN email_submissions es ON u.email = es.email
      GROUP BY u.id, u.email, u.created_at
      ORDER BY u.created_at DESC
    `);

        // Get total reports count
        const reportsResult = await query('SELECT COUNT(*) as total FROM reports');
        const totalReports = parseInt(reportsResult.rows[0].total);

        res.json({
            success: true,
            data: {
                users: usersResult.rows.map(row => ({
                    email: row.email,
                    firstSubmission: row.first_submission,
                    lastSubmission: row.last_submission,
                    submissionCount: parseInt(row.submission_count),
                    domain: row.domain
                })),
                totalReports
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
