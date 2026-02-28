
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy, Medal, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

function CompetitorDetailModal({ competitor, reportId, onClose }) {
  const { data: promptResults = [] } = useQuery({
    queryKey: ['competitorPrompts', reportId, competitor.competitor_id],
    queryFn: () => base44.entities.PromptResult.filter({ report_id: reportId }),
    enabled: !!reportId
  });

  const relevantPrompts = promptResults.filter(pr => {
    const mentions = pr.brand_mentions || {};
    return (
      mentions.chatgpt?.includes(competitor.competitor_id) ||
      mentions.gemini?.includes(competitor.competitor_id) ||
      mentions.perplexity?.includes(competitor.competitor_id) ||
      mentions.google_ai_overview?.includes(competitor.competitor_id)
    );
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#344547]">
            {competitor.competitor_name} - Detailed Analysis
          </DialogTitle>
          <div className="flex gap-4 mt-4">
            <Badge className="text-lg px-4 py-2 bg-[#344547] text-white">
              Overall Score: {competitor.overall_score}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {relevantPrompts.length} prompt mentions
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 my-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">ChatGPT</p>
            <p className="text-2xl font-bold text-[#344547]">{competitor.chatgpt_visibility}</p>
            <p className="text-xs text-slate-500">{competitor.chatgpt_mentions} mentions</p>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Gemini</p>
            <p className="text-2xl font-bold text-[#344547]">{competitor.gemini_visibility}</p>
            <p className="text-xs text-slate-500">{competitor.gemini_mentions} mentions</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Perplexity</p>
            <p className="text-2xl font-bold text-[#344547]">{competitor.perplexity_visibility}</p>
            <p className="text-xs text-slate-500">{competitor.perplexity_mentions} mentions</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Google AI</p>
            <p className="text-2xl font-bold text-[#344547]">
              {competitor.google_ai_overview_visibility !== null ? competitor.google_ai_overview_visibility : 'N/A'}
            </p>
            <p className="text-xs text-slate-500">{competitor.google_ai_overview_mentions || 0} mentions</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg text-[#344547] mb-4">Prompts Where {competitor.competitor_name} Appeared</h3>
          <div className="space-y-3">
            {relevantPrompts.map((pr, idx) => {
              const mentions = pr.brand_mentions || {};
              const platforms = [];
              if (mentions.chatgpt?.includes(competitor.competitor_id)) platforms.push('ChatGPT');
              if (mentions.gemini?.includes(competitor.competitor_id)) platforms.push('Gemini');
              if (mentions.perplexity?.includes(competitor.competitor_id)) platforms.push('Perplexity');
              if (mentions.google_ai_overview?.includes(competitor.competitor_id)) platforms.push('Google AI');

              // Find the prompt number by matching against all prompt results
              const promptNumber = promptResults.findIndex(p => p.id === pr.id) + 1;

              return (
                <Card key={idx} className="bg-slate-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{promptNumber}</span>
                      </div>
                      <p className="text-sm font-medium text-[#344547] flex-1">{pr.prompt}</p>
                    </div>
                    <div className="flex gap-2 ml-11">
                      {platforms.map(platform => (
                        <Badge key={platform} variant="secondary" className="text-xs bg-[#df1d29] text-white">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CompetitorRanking({ competitorScores, companyName, reportId }) {
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);

  if (!competitorScores || Object.keys(competitorScores).length === 0) {
    return null;
  }

  const sortedCompetitors = Object.values(competitorScores)
    .sort((a, b) => b.overall_score - a.overall_score);

  const maxScore = sortedCompetitors[0]?.overall_score || 100;

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <>
      <Card className="border-0 shadow-xl backdrop-blur-xl bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-2xl text-[#344547]">
            <TrendingUp className="w-6 h-6 text-[#df1d29]" />
            Competitive Landscape
          </CardTitle>
          <p className="text-slate-600 mt-2">
            AI visibility scores for tracked competitors
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {sortedCompetitors.map((competitor, index) => {
              const percentage = (competitor.overall_score / maxScore) * 100;

              return (
                <Button
                  key={competitor.competitor_id}
                  variant="ghost"
                  className="w-full h-auto p-0 hover:bg-transparent"
                  onClick={() => setSelectedCompetitor(competitor)}
                >
                  <div className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-slate-200 bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 min-w-[60px]">
                      <span className="text-2xl font-bold text-slate-400 w-8 text-right">
                        {index + 1}
                      </span>
                      {getRankIcon(index)}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-[#344547] text-lg">
                          {competitor.competitor_name}
                        </span>
                        <Badge className={`text-sm font-bold ${getScoreColor(competitor.overall_score)}`}>
                          {competitor.overall_score}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#df1d29] to-[#c51923] transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-slate-600">ChatGPT: {competitor.chatgpt_visibility}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600">Gemini: {competitor.gemini_visibility}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600">Perplexity: {competitor.perplexity_visibility}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">
              <strong>Note:</strong> Scores represent how frequently each competitor was mentioned by AI platforms across all tested prompts.
              Click on any competitor to see detailed prompt-by-prompt analysis.
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedCompetitor && (
        <CompetitorDetailModal
          competitor={selectedCompetitor}
          reportId={reportId}
          onClose={() => setSelectedCompetitor(null)}
        />
      )}
    </>
  );
}
