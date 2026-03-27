import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import PromptBreakdown from "../components/report/PromptBreakdown";
import PlatformComparison from "../components/report/PlatformComparison";
import SourcesList from "../components/report/SourcesList";
import CompetitorRanking from "../components/report/CompetitorRanking";

// Parse score safely - handles strings, nulls, and numbers
const parseScore = (score) => {
  if (score === null || score === undefined) return 0;
  return typeof score === 'string' ? parseFloat(score) : score;
};

export default function ReportDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('reportId');
  const [isExporting, setIsExporting] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const reports = await apiClient.entities.Report.filter({ id: reportId });
      return reports[0];
    },
    enabled: !!reportId,
  });

  // Verify user has access to this report via session storage
  useEffect(() => {
    const sessionCompanyId = sessionStorage.getItem('companyId');
    // Convert both to strings for comparison since sessionStorage stores strings
    if (report && sessionCompanyId && String(report.company_id) !== String(sessionCompanyId)) {
      console.warn('Unauthorized access attempt to different company report');
      navigate(createPageUrl("Dashboard"));
    }
  }, [report, navigate]);

  const { data: promptResults, isLoading: promptsLoading } = useQuery({
    queryKey: ['promptResults', reportId],
    queryFn: () => apiClient.entities.PromptResult.filter({ report_id: reportId }),
    enabled: !!reportId,
    initialData: [],
  });

  const { data: topicAnalyses, isLoading: topicsLoading } = useQuery({
    queryKey: ['topicAnalyses', reportId],
    queryFn: () => apiClient.entities.TopicAnalysis.filter({ report_id: reportId }),
    enabled: !!reportId,
    initialData: [],
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.functions.invoke('exportReportPDF', {
        reportId,
      });

      // response.data is already a blob from axios
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visibility-report-${report.company_name || 'report'}-${format(new Date(report.analysis_timestamp), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('PDF export failed. Please try again.');
    }
    setIsExporting(false);
  };

  const handleRerun = async () => {
    setIsRerunning(true);
    try {
      // Get all prompts from the current report's prompt results
      const promptsByTopic = {};
      promptResults.forEach(result => {
        if (!promptsByTopic[result.topic]) {
          promptsByTopic[result.topic] = [];
        }
        if (!promptsByTopic[result.topic].includes(result.prompt)) {
          promptsByTopic[result.topic].push(result.prompt);
        }
      });

      // Store prompts in sessionStorage instead of URL
      sessionStorage.setItem('analysisPrompts', JSON.stringify(promptsByTopic));

      // Navigate with minimal URL params
      const topics = report.topics_analyzed || [];
      navigate(createPageUrl("RunAnalysis") + `?companyId=${report.company_id}&topics=${encodeURIComponent(topics.join(','))}`);
    } catch (error) {
      console.error('Rerun failed:', error);
      setIsRerunning(false);
    }
  };

  // Updated loading check to include promptsLoading
  if (reportLoading || topicsLoading || promptsLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Report not found</p>
            <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-slate-600 bg-slate-50 border-slate-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Derive Google AI visibility from prompt-level "overview present" to avoid stale report rows
  const totalPromptCount = promptResults.length;
  const googleOverviewPresentCount = promptResults.reduce(
    (count, result) => count + (result.google_ai_overview_present ? 1 : 0),
    0
  );
  const computedGoogleVisibility = totalPromptCount > 0
    ? (googleOverviewPresentCount / totalPromptCount) * 100
    : parseScore(report.google_ai_overview_visibility);

  const displayReport = {
    ...report,
    google_ai_overview_visibility: computedGoogleVisibility
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handleRerun}
              disabled={isRerunning}
              variant="outline"
              className="border-[#344547] text-[#344547] hover:bg-slate-50"
            >
              {isRerunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-0 md:mr-2 animate-spin" />
                  <span className="hidden md:inline">Starting...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-0 md:mr-2" />
                  <span className="hidden md:inline">Rerun Report</span>
                </>
              )}
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-[#344547] hover:bg-[#2a3638] text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-0 md:mr-2 animate-spin" />
                  <span className="hidden md:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-0 md:mr-2" />
                  <span className="hidden md:inline">Export PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-2xl shadow-red-500/10 backdrop-blur-xl bg-white mb-8">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-[#344547] mb-2">
                  {report.company_name || 'Company Report'}
                </CardTitle>
                <p className="text-slate-600">
                  Analysis from {format(new Date(report.analysis_timestamp), 'MMMM d, yyyy')}
                </p>
              </div>
              <div className={`text-center px-6 py-4 rounded-2xl border-2 ${getScoreColor(report.overall_visibility_score)}`}>
                <div className="text-4xl font-bold mb-1">
                  {parseScore(report.overall_visibility_score) || 0}
                </div>
                <div className="text-sm font-medium">Overall Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {(report.topics_analyzed || []).map(topic => (
                <Badge key={topic} variant="secondary" className="text-sm px-3 py-1 bg-[#f7f3f0] text-[#344547]">
                  {topic}
                </Badge>
              ))}
            </div>
            <PlatformComparison report={displayReport} />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 mb-8 mt-8">
          <PromptBreakdown
            promptResults={promptResults}
            topicAnalyses={topicAnalyses}
            companyName={report.company_name}
            companyId={report.company_id.toString()}
          />

          <div className="space-y-8">
            <SourcesList topicAnalyses={topicAnalyses} promptResults={promptResults} />
            <CompetitorRanking
              competitorScores={report.competitor_scores}
              companyName={report.company_name}
              reportId={reportId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
