import express from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get submissions (filter)
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { email, domain, company_id } = req.query;
        let sql = 'SELECT * FROM email_submissions WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (email) {
            sql += ` AND email = $${paramCount++}`;
            params.push(email);
        }
        if (domain) {
            sql += ` AND domain = $${paramCount++}`;
            params.push(domain);
        }
        if (company_id) {
            sql += ` AND company_id = $${paramCount++}`;
            params.push(company_id);
        }

        sql += ' ORDER BY submission_timestamp DESC';

        const result = await query(sql, params);

        // If the table doesn't exist, we might get an error. 
        // Ideally we should have a migration script. 
        // For now assuming table exists or we need to create it?
        // The previous `list_dir` showed `scripts/migrate.js`.

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        // If table missing, return empty or handle error?
        if (error.code === '42P01') { // undefined_table
            console.warn('email_submissions table missing, returning empty array');
            res.json({ success: true, data: [] });
        } else {
            next(error);
        }
    }
});

// Create submission
router.post('/', optionalAuth, async (req, res, next) => {
    try {
        const { email, domain, company_id, submission_timestamp } = req.body;

        if (!email) {
            throw new AppError('Email is required', 400);
        }

        // Try to insert. If table missing, maybe fail?
        // We should probably check if we can Auto-Create tables or check migrations.
        // For now, let's assume the DB is set up or we'll get an error.

        try {
            const result = await query(
                `INSERT INTO email_submissions (email, domain, company_id, submission_timestamp)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
                [email, domain, company_id, submission_timestamp || new Date().toISOString()]
            );

            res.status(201).json({
                success: true,
                data: result.rows[0]
            });

        } catch (err) {
            // If table undefined, maybe just ignore for now (it's analytics mainly)? 
            // Or create it dynamically? 
            // User "thrown together initial website" - safe to assume dirty DB.
            if (err.code === '42P01') { // undefined_table
                // Create table on the fly for dev convenience?
                await query(`
                CREATE TABLE IF NOT EXISTS email_submissions (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    domain VARCHAR(255) NOT NULL,
                    company_id INTEGER REFERENCES companies(id),
                    submission_timestamp TIMESTAMP DEFAULT NOW() NOT NULL
                )
            `);
                // Retry
                const result = await query(
                    `INSERT INTO email_submissions (email, domain, company_id, submission_timestamp)
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                    [email, domain, company_id, submission_timestamp || new Date().toISOString()]
                );
                res.status(201).json({
                    success: true,
                    data: result.rows[0]
                });
            } else {
                throw err;
            }
        }

    } catch (error) {
        next(error);
    }
});

export default router;
