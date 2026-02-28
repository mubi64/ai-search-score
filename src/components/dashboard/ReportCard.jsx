import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ArrowRight, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import PlatformIcon from "@/components/ui/PlatformIcon";

export default function ReportCard({ report }) {
  const navigate = useNavigate();

  // Parse score safely - handles strings, nulls, and numbers
  const parseScore = (score) => {
    if (score === null || score === undefined) return 0;
    return typeof score === 'string' ? parseFloat(score) : score;
  };

  const score = parseScore(report.overall_visibility_score);

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const platforms = [
    { key: 'chatgpt', name: 'ChatGPT', value: report.chatgpt_visibility || 0 },
    { key: 'gemini', name: 'Gemini', value: report.gemini_visibility || 0 },
    { key: 'perplexity', name: 'Perplexity', value: report.perplexity_visibility || 0 },
    { key: 'google', name: 'Google AI', value: report.google_ai_overview_visibility || 0 }
  ];

  const topics = report.topics_analyzed || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="hover:shadow-2xl transition-all duration-300 border-slate-200 overflow-hidden bg-white cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-2xl font-bold text-[#344547] group-hover:text-[#df1d29] transition-colors">
                  {report.company_name || 'Report'}
                </h3>
                <div className={`px-4 py-2 rounded-lg font-bold text-lg border-2 ${getScoreColor(score)}`}>
                  {score.toFixed(0)}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Calendar className="w-4 h-4" />
                {format(new Date(report.analysis_timestamp), 'MMM d, yyyy \'at\' h:mm a')}
              </div>

              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {topics.slice(0, 3).map(topic => (
                    <Badge key={topic} variant="secondary" className="text-xs bg-[#f7f3f0] text-[#344547]">
                      {topic}
                    </Badge>
                  ))}
                  {topics.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-[#f7f3f0] text-[#344547]">
                      +{topics.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map(platform => (
                  <div key={platform.key} className="flex items-center gap-2">
                    <PlatformIcon platform={platform.key} size="sm" />
                    <div>
                      <p className="text-xs text-slate-500">{platform.name}</p>
                      <p className="font-bold text-[#344547]">
                        {platform.value !== null && platform.value !== undefined ? platform.value : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <Button
                onClick={() => navigate(createPageUrl("ReportDetail") + `?reportId=${report.id}`)}
                className="bg-[#df1d29] hover:bg-[#c51923] text-white group-hover:shadow-lg transition-all"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
