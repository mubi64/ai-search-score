import React from "react";
import { motion } from "framer-motion";
import PlatformIcon from "../ui/PlatformIcon";

export default function PlatformComparison({ report }) {
  const platforms = [
    {
      id: "chatgpt",
      name: "ChatGPT",
      score: report.chatgpt_visibility || 0,
      mentions: report.chatgpt_total_mentions || 0
    },
    {
      id: "gemini",
      name: "Gemini",
      score: report.gemini_visibility || 0,
      mentions: report.gemini_total_mentions || 0
    },
    {
      id: "perplexity",
      name: "Perplexity",
      score: report.perplexity_visibility || 0,
      mentions: report.perplexity_total_mentions || 0
    },
    {
      id: "google",
      name: "Google AI",
      score: report.google_ai_overview_visibility || 0,
      mentions: report.google_ai_overview_total_mentions || 0,
      isNull: report.google_ai_overview_visibility === null
    }
  ];

  const getScoreColor = (score) => {
    if (score >= 75) return 'from-green-500 to-emerald-600';
    if (score >= 50) return 'from-blue-500 to-indigo-600';
    return 'from-red-500 to-orange-600';
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {platforms.map((platform, index) => (
        <motion.div
          key={platform.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-all hover:shadow-lg"
        >
          {/* Platform Icon and Name */}
          <div className="flex items-center gap-3 mb-4">
            <PlatformIcon platform={platform.id} size="sm" />
            <h4 className="font-bold text-slate-900">{platform.name}</h4>
          </div>

          {/* Score Display */}
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm text-slate-600">Visibility Score</span>
              <span className="text-2xl font-bold text-slate-900">{platform.score}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getScoreColor(platform.score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${platform.score}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
              />
            </div>
          </div>

          {/* Mentions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-lg font-bold text-slate-900">{platform.mentions}</span>
            <span className="text-sm text-slate-600">Total Mentions</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}