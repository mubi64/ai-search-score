import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Mock data - in production, this would come from historical reports
const generateMockTrendData = (currentScores) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, index) => ({
    month,
    ChatGPT: Math.max(0, (currentScores.chatgpt || 70) - (5 - index) * 5 + Math.random() * 10),
    Gemini: Math.max(0, (currentScores.gemini || 60) - (5 - index) * 4 + Math.random() * 8),
    Perplexity: Math.max(0, (currentScores.perplexity || 65) - (5 - index) * 6 + Math.random() * 12),
    'Google AI': Math.max(0, (currentScores.google || 50) - (5 - index) * 4 + Math.random() * 10),
  }));
};

export default function VisibilityTrends({ report }) {
  const currentScores = {
    chatgpt: report.chatgpt_visibility || 0,
    gemini: report.gemini_visibility || 0,
    perplexity: report.perplexity_visibility || 0,
    google: report.google_ai_overview_visibility || 0
  };

  const trendData = generateMockTrendData(currentScores);

  // Calculate trend direction (comparing last two data points)
  const getTrend = (platform) => {
    if (trendData.length < 2) return 'stable';
    const current = trendData[trendData.length - 1][platform];
    const previous = trendData[trendData.length - 2][platform];
    const diff = current - previous;
    if (diff > 2) return 'up';
    if (diff < -2) return 'down';
    return 'stable';
  };

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const platforms = [
    { key: 'ChatGPT', color: '#10b981', trend: getTrend('ChatGPT') },
    { key: 'Gemini', color: '#3b82f6', trend: getTrend('Gemini') },
    { key: 'Perplexity', color: '#a855f7', trend: getTrend('Perplexity') },
    { key: 'Google AI', color: '#ef4444', trend: getTrend('Google AI') }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-2xl font-bold text-[#344547]">
            Visibility Trends
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Track your brand's AI visibility over time
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Trend indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {platforms.map((platform) => (
              <div key={platform.key} className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                <TrendIcon trend={platform.trend} />
                <div>
                  <p className="text-xs text-slate-600">{platform.key}</p>
                  <p className={`text-sm font-semibold ${platform.trend === 'up' ? 'text-green-600' :
                    platform.trend === 'down' ? 'text-red-600' :
                      'text-slate-600'
                    }`}>
                    {platform.trend === 'up' ? '↑ Improving' :
                      platform.trend === 'down' ? '↓ Declining' :
                        '→ Stable'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {platforms.map((platform) => (
                <Line
                  key={platform.key}
                  type="monotone"
                  dataKey={platform.key}
                  stroke={platform.color}
                  strokeWidth={3}
                  dot={{ fill: platform.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <p className="text-xs text-slate-500 mt-4 text-center">
            * Historical data is simulated for demonstration purposes
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
