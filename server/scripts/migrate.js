import { pool } from '../config/database.js';

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        login_count INTEGER DEFAULT 0,
        last_login_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        industry VARCHAR(255),
        products TEXT[],
        logo_url TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Competitors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitors (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        competitor_name VARCHAR(255) NOT NULL,
        reason TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        company_name VARCHAR(255),
        topics_analyzed TEXT[],
        overall_visibility_score DECIMAL(5,2),
        chatgpt_visibility DECIMAL(5,2),
        gemini_visibility DECIMAL(5,2),
        perplexity_visibility DECIMAL(5,2),
        google_ai_overview_visibility DECIMAL(5,2),
        total_mentions INTEGER DEFAULT 0,
        chatgpt_total_mentions INTEGER DEFAULT 0,
        gemini_total_mentions INTEGER DEFAULT 0,
        perplexity_total_mentions INTEGER DEFAULT 0,
        google_ai_overview_total_mentions INTEGER DEFAULT 0,
        competitor_scores JSONB,
        brands_tracked JSONB,
        generic_terms_blacklist TEXT[],
        analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        total_prompts INTEGER DEFAULT 0,
        completed_prompts INTEGER DEFAULT 0,
        error_message TEXT,
        debug_log TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Topic Analysis table
    await client.query(`
      CREATE TABLE IF NOT EXISTS topic_analyses (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
        topic VARCHAR(255) NOT NULL,
        prompts_tested TEXT[],
        chatgpt_mentions INTEGER DEFAULT 0,
        chatgpt_positioning TEXT,
        chatgpt_sources JSONB,
        gemini_mentions INTEGER DEFAULT 0,
        gemini_positioning TEXT,
        gemini_sources JSONB,
        perplexity_mentions INTEGER DEFAULT 0,
        perplexity_positioning TEXT,
        perplexity_sources JSONB,
        google_ai_overview_mentions INTEGER DEFAULT 0,
        google_ai_overview_positioning TEXT,
        google_ai_overview_sources JSONB,
        visibility_score DECIMAL(5,2),
        key_insights TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Prompt Results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompt_results (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
        topic VARCHAR(255),
        prompt TEXT NOT NULL,
        brand_mentions JSONB,
        chatgpt_response TEXT,
        gemini_response TEXT,
        perplexity_response TEXT,
        google_ai_overview_present BOOLEAN DEFAULT false,
        google_ai_overview_response TEXT,
        google_search_results JSONB,
        overall_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Email Submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_submissions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        company_id INTEGER REFERENCES companies(id),
        submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Add new columns to existing tables (safe to run repeatedly)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS total_prompts INTEGER DEFAULT 0;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS completed_prompts INTEGER DEFAULT 0;
      END $$;
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_competitors_company_id ON competitors(company_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_prompt_results_report_id ON prompt_results(report_id);');

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables();
