import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, Plus, X, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitorReview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('companyId');

  const [competitors, setCompetitors] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState("");

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await apiClient.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  const { data: existingCompetitors, isLoading: competitorsLoading } = useQuery({
    queryKey: ['competitors', companyId],
    queryFn: () => apiClient.entities.Competitor.filter({ company_id: companyId }),
    enabled: !!companyId,
    initialData: [],
  });

  useEffect(() => {
    const sessionCompanyId = sessionStorage.getItem('companyId');
    if (companyId && sessionCompanyId && companyId !== sessionCompanyId) {
      console.warn('Unauthorized access attempt to different company');
      navigate(createPageUrl("Start"));
    }
  }, [companyId, navigate]);

  useEffect(() => {
    if (existingCompetitors && existingCompetitors.length > 0 && !hasGenerated) {
      setCompetitors(existingCompetitors.map(c => ({
        id: c.id,
        name: c.competitor_name,
        reason: c.reason || '',
        isActive: c.is_active !== false,
        isExisting: true
      })));
      setHasGenerated(true);
    } else if (company && existingCompetitors.length === 0 && !hasGenerated) {
      generateCompetitors();
    }
  }, [company, existingCompetitors, hasGenerated]);

  const generateCompetitors = async () => {
    setIsGenerating(true);
    try {
      const result = await apiClient.functions.invoke('discoverCompetitors', {
        companyName: company.name,
        industry: company.industry,
        products: company.products
      });

      const suggested = result.data.competitors.map((c, idx) => ({
        id: `temp-${idx}`,
        name: c.name,
        reason: c.why || '',
        isActive: true,
        isExisting: false
      }));

      setCompetitors(suggested);
      setHasGenerated(true);
    } catch (error) {
      console.error('Failed to generate competitors:', error);
    }
    setIsGenerating(false);
  };

  const toggleCompetitor = (id) => {
    setCompetitors(prev => prev.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const removeCompetitor = (id) => {
    setCompetitors(prev => prev.filter(c => c.id !== id));
  };

  const addCustomCompetitor = () => {
    if (newCompetitorName.trim()) {
      const trimmedName = newCompetitorName.trim();
      setCompetitors(prev => [...prev, {
        id: `temp-${Date.now()}`,
        name: trimmedName,
        reason: 'Custom competitor',
        isActive: true,
        isExisting: false
      }]);
      setNewCompetitorName("");
    }
  };

  const saveAndContinue = async () => {
    // Delete existing competitors
    const deletePromises = existingCompetitors.map(c =>
      apiClient.entities.Competitor.delete(c.id)
    );
    await Promise.all(deletePromises);

    // Create new competitors
    const activeCompetitors = competitors.filter(c => c.isActive);

    const createPromises = activeCompetitors.map(c =>
      apiClient.entities.Competitor.create({
        company_id: companyId,
        competitor_name: c.name,
        reason: c.reason,
        is_active: c.isActive
      })
    );
    await Promise.all(createPromises);

    queryClient.invalidateQueries(['competitors', companyId]);
    navigate(createPageUrl("TopicSelection") + `?companyId=${companyId}`);
  };

  if (companyLoading || competitorsLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Card>
            <CardContent className="pt-6">
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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#344547] mb-2">
              Review Competitors
            </h1>
            <p className="text-lg text-slate-600">
              We've identified competitors for {company?.name}. Review, edit, or add more.
            </p>
          </div>
          <Button
            onClick={() => {
              setHasGenerated(false);
              setCompetitors([]);
              generateCompetitors();
            }}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Regenerate
          </Button>
        </div>

        {isGenerating ? (
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#df1d29] mx-auto mb-4" />
              <p className="text-lg text-slate-600">Discovering competitors...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-0 shadow-xl backdrop-blur-xl bg-white mb-6">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-2xl text-[#344547]">Suggested Competitors</CardTitle>
                <p className="text-slate-500 mt-2">
                  Select which competitors you'd like to track. Their visibility will be measured using the same prompts.
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {competitors.map((competitor) => (
                    <Card
                      key={competitor.id}
                      className={`p-4 transition-all duration-200 border-2 ${competitor.isActive
                        ? 'border-slate-600 bg-slate-50'
                        : 'border-slate-200 bg-white opacity-60'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={competitor.isActive}
                          onCheckedChange={() => toggleCompetitor(competitor.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#344547]">{competitor.name}</h3>
                          <p className="text-sm text-slate-600">{competitor.reason}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCompetitor(competitor.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 mt-6">
                  <div className="flex gap-3">
                    <Input
                      value={newCompetitorName}
                      onChange={(e) => setNewCompetitorName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomCompetitor()}
                      placeholder="Add a competitor..."
                      className="flex-1 placeholder:text-slate-400"
                    />
                    <Button
                      onClick={addCustomCompetitor}
                      disabled={!newCompetitorName.trim()}
                      className="bg-[#df1d29] hover:bg-[#c51923]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </Card>
              </CardContent>
            </Card>

            {competitors.filter(c => c.isActive).length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  {competitors.filter(c => c.isActive).length} competitor{competitors.filter(c => c.isActive).length !== 1 ? 's' : ''} selected for tracking
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={saveAndContinue}
                className="bg-[#df1d29] hover:bg-[#c51923] text-white shadow-lg shadow-red-500/30 text-lg px-8"
              >
                Continue to Topics
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}