import React, { useState, useEffect, useRef } from "react";
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

  // Refs for smooth progress animation (persist across renders)
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const analysisStartTimeRef = useRef(null);

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
      setProgress(100);
      setAnalysisComplete(true);
      queryClient.invalidateQueries(['reports']);

      sessionStorage.removeItem('analysisPrompts');

      setTimeout(() => {
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
      const report = await apiClient.entities.Report.create({
        company_id: companyId,
        company_name: company.name,
        topics_analyzed: topics,
        status: 'running',
        analysis_timestamp: new Date().toISOString()
      });

      setReportId(report.id);

      try {
        const response = await apiClient.functions.invoke('runAnalysis', {
          companyId,
          reportId: report.id,
          topics,
          promptsByTopic
        });

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
      startAnalysisMutation.mutate();
    }
  }, [company, topics, companyId, promptsByTopic, hasTriggered, startAnalysisMutation.isPending, analysisComplete, analysisFailed]);

  // Poll real analysis progress from the server
  const { data: progressData } = useQuery({
    queryKey: ['analysisProgress', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const result = await apiClient.functions.invoke('getAnalysisProgress', { report_id: reportId });
      return result;
    },
    enabled: !!reportId && !analysisComplete && !analysisFailed,
    refetchInterval: 2000  // Poll every 2 seconds for responsive updates
  });

  // Update target progress when real data arrives from server
  useEffect(() => {
    if (!progressData) return;
    const serverPct = progressData.progress?.percentage || 0;
    if (serverPct > 0) {
      // Map server 0-100% to 0-95% of progress bar (last 5% reserved for completion)
      const mappedPct = serverPct * 0.95;
      targetProgressRef.current = Math.max(targetProgressRef.current, mappedPct);
    }
  }, [progressData]);

  // Smooth animation + slow creep between real updates
  useEffect(() => {
    if (!hasTriggered || analysisComplete || analysisFailed) return;

    if (!analysisStartTimeRef.current) {
      analysisStartTimeRef.current = Date.now();
    }

    const MAX_SIMULATED = 95; // Never exceed 95% until report is actually complete

    const animationInterval = setInterval(() => {
      const target = targetProgressRef.current;
      let smooth = smoothProgressRef.current;

      if (smooth < target) {
        // Chase the real target quickly with easing
        smooth += Math.max(0.5, (target - smooth) * 0.12);
        if (smooth > target) smooth = target;
      } else {
        // Slow creep between real updates so the bar always appears moving
        smooth += 0.03;
        // Don't creep more than 5% past the last real target, and cap at MAX_SIMULATED
        const creepLimit = Math.min(target + 5, MAX_SIMULATED);
        if (smooth > creepLimit) smooth = creepLimit;
      }

      smoothProgressRef.current = smooth;
      setProgress(Math.min(Math.round(smooth), MAX_SIMULATED));
    }, 200);

    // Fallback: if analysis hasn't completed after max wait time, redirect anyway
    const maxWaitTimeout = setTimeout(() => {
      if (!analysisComplete && !analysisFailed) {
        console.log('⏱️ Max wait time reached. Redirecting to dashboard...');
        setAnalysisComplete(true);
        sessionStorage.removeItem('analysisPrompts');
        navigate(createPageUrl("Dashboard"));
      }
    }, 600000); // 10 minutes max wait

    return () => {
      clearInterval(animationInterval);
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
                    <p className="text-sm text-slate-500">
                      {progressData?.progress?.completed > 0 && progressData?.progress?.total > 0
                        ? `Processing prompt ${progressData.progress.completed} of ${progressData.progress.total}...`
                        : 'Starting analysis...'}
                    </p>
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