import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import AnalysisProgress, { AnalysisSteps } from "../components/analysis/AnalysisProgress";
import EnhancedAnalysisProgress from "../components/analysis/EnhancedAnalysisProgress";
import DidYouKnow from "../components/analysis/DidYouKnow";

export default function RunAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('companyId');
  const topics = urlParams.get('topics')?.split(',') || [];

  const promptsByTopic = React.useMemo(() => {
    try {
      const storedPrompts = sessionStorage.getItem('analysisPrompts');
      if (storedPrompts) {
        return JSON.parse(storedPrompts);
      }
      return {};
    } catch (error) {
      console.error('Error parsing prompts from sessionStorage:', error);
      return {};
    }
  }, []);

  const [reportId, setReportId] = useState(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  const totalPrompts = Object.values(promptsByTopic).reduce((sum, prompts) => sum + prompts.length, 0);

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await apiClient.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId
  });

  useEffect(() => {
    const sessionCompanyId = sessionStorage.getItem('companyId');
    if (companyId && (!sessionCompanyId || companyId !== sessionCompanyId)) {
      console.warn('Unauthorized access attempt or companyId mismatch.');
      navigate(createPageUrl("Dashboard"));
    }
  }, [companyId, navigate]);

  useEffect(() => {
    if (Object.keys(promptsByTopic).length === 0 && companyId && topics.length > 0) {
      console.error('No prompts found in sessionStorage for analysis, redirecting to dashboard.');
      navigate(createPageUrl("Dashboard"));
    }
  }, [promptsByTopic, navigate, companyId, topics]);

  const { data: reportStatus } = useQuery({
    queryKey: ['reportStatus', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const reports = await apiClient.entities.Report.filter({ id: reportId });
      return reports[0];
    },
    enabled: !!reportId && !analysisComplete && !analysisFailed,
    refetchInterval: 3000  // Poll every 3 seconds instead of 5
  });

  useEffect(() => {
    if (reportStatus?.status === 'completed' && !analysisComplete) {
      console.log('✅ Analysis completed successfully! Redirecting...');
      setProgress(100);
      setAnalysisComplete(true);
      queryClient.invalidateQueries(['reports']);

      sessionStorage.removeItem('analysisPrompts');

      setTimeout(() => {
        console.log('Navigating to dashboard...');
        navigate(createPageUrl("Dashboard"));
      }, 2000);
    } else if (reportStatus?.status === 'failed' && !analysisFailed) {
      console.error('❌ Analysis failed');
      console.error('Error message:', reportStatus.error_message);
      setAnalysisFailed(true);
      setErrorDetails(reportStatus.error_message || 'Unknown error occurred');
      setProgress(0);
      sessionStorage.removeItem('analysisPrompts');
    }
  }, [reportStatus, analysisComplete, analysisFailed, navigate, queryClient]);

  const startAnalysisMutation = useMutation({
    mutationFn: async () => {
      console.log('📝 Creating report...');
      const report = await apiClient.entities.Report.create({
        company_id: companyId,
        company_name: company.name,
        topics_analyzed: topics,
        status: 'running',
        analysis_timestamp: new Date().toISOString()
      });

      console.log('📝 Report created with ID:', report.id);
      setReportId(report.id);

      console.log('🚀 Triggering analysis function...');
      try {
        const response = await apiClient.functions.invoke('runAnalysis', {
          companyId,
          reportId: report.id,
          topics,
          promptsByTopic
        });

        console.log('✅ Analysis function response:', response.data);
      } catch (error) {
        const isExpectedTimeout =
          error.message?.includes('502') ||
          error.message?.includes('503') ||
          error.message?.includes('timeout') ||
          error.code === 'ECONNABORTED' ||
          error.response?.status === 502 ||
          error.response?.status === 503;

        if (isExpectedTimeout) {
          console.log('⏱️  Request timed out as expected - analysis running in background');
        } else {
          console.error('❌ Unexpected error starting analysis:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.response?.status,
            code: error.code,
            data: error.response?.data
          });
          throw error;
        }
      }

      return { reportId: report.id };
    },
    onError: (error) => {
      console.error('Failed to start analysis:', error);
      setAnalysisFailed(true);
      setErrorDetails(error.message || 'Failed to start analysis');
      setProgress(0);
      sessionStorage.removeItem('analysisPrompts');
    }
  });

  useEffect(() => {
    const sessionCompanyId = sessionStorage.getItem('companyId');

    if (
      company &&
      topics.length > 0 &&
      companyId &&
      companyId === sessionCompanyId &&
      Object.keys(promptsByTopic).length > 0 &&
      !hasTriggered &&
      !startAnalysisMutation.isPending &&
      !analysisComplete &&
      !analysisFailed) {
      setHasTriggered(true);
      console.log('🚀 Starting analysis...');
      startAnalysisMutation.mutate();
    }
  }, [company, topics, companyId, promptsByTopic, hasTriggered, startAnalysisMutation.isPending, analysisComplete, analysisFailed]);

  useEffect(() => {
    if (!hasTriggered || analysisComplete || analysisFailed) return;

    const totalDuration = 360000;
    const updateInterval = 500;
    const totalSteps = totalDuration / updateInterval;
    const incrementPerStep = 99 / totalSteps;

    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += incrementPerStep;

      if (currentProgress >= 99) {
        currentProgress = 99;
        clearInterval(timer);
      }

      setProgress(Math.floor(currentProgress));
    }, updateInterval);

    // Fallback: if analysis hasn't completed after max wait time, redirect anyway
    const maxWaitTimeout = setTimeout(() => {
      if (!analysisComplete && !analysisFailed) {
        console.log('⏱️ Max wait time reached. Redirecting to dashboard...');
        setAnalysisComplete(true);
        sessionStorage.removeItem('analysisPrompts');
        navigate(createPageUrl("Dashboard"));
      }
    }, 480000); // 8 minutes max wait

    return () => {
      clearInterval(timer);
      clearTimeout(maxWaitTimeout);
    };
  }, [hasTriggered, analysisComplete, analysisFailed, navigate]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-[#f7f3f0]">
      <div className="max-w-4xl w-full">
        <Card className="border-0 shadow-2xl shadow-red-500/10 backdrop-blur-xl bg-white">
          <CardHeader className="border-b border-slate-100 text-center pb-6">
            <CardTitle className="text-3xl font-bold text-[#344547] mb-2">
              {analysisComplete ? 'Analysis Complete!' : analysisFailed ? 'Analysis Failed' : 'Running Analysis'}
            </CardTitle>
            <p className="text-slate-600">
              {analysisComplete ?
                'Your visibility report is ready' :
                analysisFailed ?
                  'Something went wrong' :
                  `Analyzing ${company?.name || 'your company'} across AI platforms...`}
            </p>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            {analysisComplete ?
              <div className="text-center py-8">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <p className="text-lg text-slate-600">Redirecting to dashboard...</p>
              </div> :
              analysisFailed ?
                <div className="text-center py-8">
                  <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                  <p className="text-lg text-slate-600 mb-4">Analysis failed to complete</p>
                  {errorDetails &&
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 mb-1">Error Details:</p>
                          <p className="text-sm text-red-700 font-mono">{errorDetails}</p>
                        </div>
                      </div>
                    </div>
                  }
                  <p className="text-sm text-slate-500 mb-4">
                    Please try again or contact support if the issue persists.
                  </p>
                  <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
                    Go to Dashboard
                  </Button>
                </div> :

                <div className="space-y-6">
                  <EnhancedAnalysisProgress progress={progress} />
                  <div className="text-center">
                    <p className="text-sm text-slate-500">This may take 3-4 minutes.</p>
                    {reportId &&
                      <p className="text-xs text-slate-400 mt-1">
                        Report ID: {reportId}
                      </p>
                    }
                  </div>

                  <DidYouKnow />

                </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>);

}