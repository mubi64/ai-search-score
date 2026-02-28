
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmailForm from "../components/start/EmailForm";
import CompanyPreview from "../components/start/CompanyPreview";

export default function Start() {
  const navigate = useNavigate();
  const [discovering, setDiscovering] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    const trackLogin = async () => {
      try {
        const user = await apiClient.auth.me();
        if (user) {
          await apiClient.auth.updateMe({
            login_count: (user.login_count || 0) + 1,
            last_login_date: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.log('Could not track login:', error);
      }
    };
    trackLogin();
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      const sessionCompanyId = sessionStorage.getItem('companyId');
      const sessionCompanyDomain = sessionStorage.getItem('companyDomain');

      if (sessionCompanyId && sessionCompanyDomain) {
        try {
          const companies = await apiClient.entities.Company.filter({ id: sessionCompanyId });
          if (companies.length > 0) {
            setCompanyData(companies[0]);
            setCheckingExisting(false);
            return;
          }
        } catch (error) {
          console.log('Could not load company from session, will show email form');
        }
      }

      setCheckingExisting(false);
    };

    checkExistingSession();
  }, []);

  const handleDiscovery = (data) => {
    setCompanyData(data);
    sessionStorage.setItem('companyData', JSON.stringify(data));
    setDiscovering(false);
  };

  const handleCompanyChange = (newCompany) => {
    setCompanyData(newCompany);
    sessionStorage.setItem('companyData', JSON.stringify(newCompany));
  };

  const handleStartAnalysis = (company) => {
    navigate(createPageUrl("CompetitorReview") + `?companyId=${company.id}`);
  };

  const handleStartOver = () => {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('companyId');
    sessionStorage.removeItem('companyDomain');
    sessionStorage.removeItem('companyData');
    sessionStorage.removeItem('isNewUser');
    setCompanyData(null);
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#df1d29] mx-auto mb-4" />
            <p className="text-[#344547]">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#df1d29] via-[#c51923] to-[#344547] bg-clip-text text-transparent">
            Get Your AISearchScore
          </h1>
          <p className="text-xl text-[#344547] max-w-2xl mx-auto">
            Track your brand's presence across ChatGPT, Gemini, Perplexity, and Google AI Overviews to understand how AI sees your business
          </p>
        </div>

        {!companyData ? (
          <Card className="border-0 shadow-2xl shadow-slate-200 backdrop-blur-xl bg-white">
            <CardHeader className="border-b border-slate-100 pb-6">
              <CardTitle className="text-2xl font-bold text-[#344547]">
                Discover Your Company
              </CardTitle>
              <p className="text-slate-500 mt-2">
                Enter your business email to automatically identify your brand and get your search score.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {discovering ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-[#df1d29] mb-4" />
                  <p className="text-[#344547] font-medium">Researching your company...</p>
                  <p className="text-sm text-slate-500 mt-2">This may take a moment</p>
                </div>
              ) : (
                <EmailForm 
                  onDiscovering={() => setDiscovering(true)}
                  onDiscovered={handleDiscovery}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <CompanyPreview 
            company={companyData}
            onStartAnalysis={handleStartAnalysis}
            onStartOver={handleStartOver}
            onCompanyChange={handleCompanyChange}
            isNewUser={sessionStorage.getItem('isNewUser') === 'true'}
          />
        )}

        <div className="mt-12 text-center">
          <button
            onClick={() => {
              navigate(createPageUrl("AdminLogin"));
            }}
            className="text-[10px] text-slate-300 hover:text-slate-400 transition-colors"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
