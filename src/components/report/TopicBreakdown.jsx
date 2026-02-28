import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TopicBreakdown({ topicAnalyses }) {
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 mb-8">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Package className="w-6 h-6 text-blue-600" />
          Topic Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {topicAnalyses.map((analysis) => (
            <div key={analysis.id} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900">{analysis.topic}</h3>
                <div className={`text-3xl font-bold ${getScoreColor(analysis.visibility_score)}`}>
                  {analysis.visibility_score || 0}
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">ChatGPT</p>
                  <p className="text-2xl font-bold text-purple-600">{analysis.chatgpt_mentions || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">mentions</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Gemini</p>
                  <p className="text-2xl font-bold text-teal-600">{analysis.gemini_mentions || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">mentions</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Perplexity</p>
                  <p className="text-2xl font-bold text-blue-600">{analysis.perplexity_mentions || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">mentions</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Google AI</p>
                  <p className="text-2xl font-bold text-orange-600">{analysis.google_ai_overview_mentions || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">mentions</p>
                </div>
              </div>

              {analysis.key_insights && analysis.key_insights.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {analysis.key_insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-semibold">Tested {analysis.prompts_tested?.length || 0} prompts</span> across all platforms
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}