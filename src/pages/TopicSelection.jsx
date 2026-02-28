
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TopicSelector from "../components/topics/TopicSelector";

export default function TopicSelection() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('companyId');
  
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [includeGeneral, setIncludeGeneral] = useState(true); // Changed from false to true

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await apiClient.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  // Verify user has access to this company via session storage
  useEffect(() => {
    const sessionCompanyId = sessionStorage.getItem('companyId');
    if (companyId && sessionCompanyId && companyId !== sessionCompanyId) {
      console.warn('Unauthorized access attempt to different company');
      navigate(createPageUrl("Start"));
    }
  }, [companyId, navigate]);

  const handleStartAnalysis = () => {
    const topics = includeGeneral 
      ? ['General Company Presence', ...selectedTopics]
      : selectedTopics;
    
    navigate(createPageUrl("PromptReview") + `?companyId=${companyId}&topics=${encodeURIComponent(topics.join(','))}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-[#f7f3f0]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Company not found or unauthorized access.</p>
            <Button onClick={() => navigate(createPageUrl("Start"))}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Start"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#344547] mb-2">
            Select Topics to Track
          </h1>
          <p className="text-lg text-slate-600">
            Choose which products or topics you'd like to monitor for {company.name}
          </p>
        </div>

        <Card className="border-0 shadow-xl backdrop-blur-xl bg-white mb-6">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-2xl text-[#344547]">Available Topics</CardTitle>
            <p className="text-slate-500 mt-2">
              Select one or more products, or track your general company presence
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <TopicSelector
              products={company.products || []}
              selectedTopics={selectedTopics}
              setSelectedTopics={setSelectedTopics}
              includeGeneral={includeGeneral}
              setIncludeGeneral={setIncludeGeneral}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleStartAnalysis}
            disabled={selectedTopics.length === 0 && !includeGeneral}
            className="bg-[#df1d29] hover:bg-[#c51923] text-white shadow-lg shadow-red-500/30 text-lg px-8"
          >
            Start Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
