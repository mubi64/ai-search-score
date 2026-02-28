import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register/Login (email-only, no password for now)
router.post('/email-login', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Check if user exists
    let result = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      // Create new user
      result = await query(
        'INSERT INTO users (email, login_count, last_login_date) VALUES ($1, 1, NOW()) RETURNING *',
        [email]
      );
      user = result.rows[0];
    } else {
      // Update login info
      await query(
        'UPDATE users SET login_count = login_count + 1, last_login_date = NOW() WHERE id = $1',
        [user.id]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        login_count: user.login_count,
        last_login_date: user.last_login_date
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        login_count: user.login_count,
        last_login_date: user.last_login_date
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, login_count, last_login_date } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (login_count !== undefined) {
      updates.push(`login_count = $${paramCount++}`);
      values.push(login_count);
    }
    if (last_login_date !== undefined) {
      updates.push(`last_login_date = $${paramCount++}`);
      values.push(last_login_date);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
