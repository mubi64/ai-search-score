import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import reportRoutes from './routes/reports.js';
import competitorRoutes from './routes/competitors.js';
import analysisRoutes from './routes/analysis.js';
import emailSubmissionRoutes from './routes/email_submissions.js';
import topicAnalysisRoutes from './routes/topic_analyses.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/email_submissions', emailSubmissionRoutes);
app.use('/api/topic_analyses', topicAnalysisRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 AI Search Score API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
