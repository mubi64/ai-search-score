
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Package, ArrowRight, RotateCcw, LayoutDashboard, Search, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompanyPreview({ company, onStartAnalysis, onStartOver, isNewUser = false, onCompanyChange }) {
  const navigate = useNavigate();
  const [showAlternative, setShowAlternative] = useState(false);
  const [alternativeDomain, setAlternativeDomain] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  // Generate company logo URL (using UI Avatars as fallback)
  const getCompanyLogo = (companyName, domain) => {
    // Try to get favicon from Google's service
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
    // Fallback to UI Avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=df1d29&color=fff&bold=true`;
  };

  const handleAlternativeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSearching(true);

    try {
      // Clean up the domain input
      let domain = alternativeDomain.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

      if (!domain) {
        setError("Please enter a valid domain");
        setIsSearching(false);
        return;
      }

      // Try to discover the alternative company
      const result = await apiClient.functions.invoke('discoverCompany', { domain });

      if (result.data.error) {
        setError(result.data.error);
        setIsSearching(false);
        return;
      }

      // Check if company already exists
      let alternativeCompany;
      try {
        const existingCompanies = await apiClient.entities.Company.filter({ domain });
        if (existingCompanies.length > 0) {
          alternativeCompany = existingCompanies[0];
        }
      } catch (filterError) {
        console.error("Could not check for existing company, will create new one");
      }

      // Create company if it doesn't exist
      if (!alternativeCompany) {
        alternativeCompany = await apiClient.entities.Company.create({
          domain,
          name: result.data.name,
          description: result.data.description,
          products: result.data.products,
          industry: result.data.industry
        });
      }

      // Track email submission for alternative search
      const userEmail = sessionStorage.getItem('userEmail');
      if (userEmail) {
        try {
          await apiClient.entities.EmailSubmission.create({
            email: userEmail.toLowerCase(),
            domain,
            company_id: alternativeCompany.id,
            submission_timestamp: new Date().toISOString()
          });
        } catch (trackError) {
          console.error("Could not track email submission:", trackError);
        }
      }

      // Update session for current session only
      sessionStorage.setItem('companyId', alternativeCompany.id);
      sessionStorage.setItem('companyDomain', domain);

      // Reset the alternative search UI
      setShowAlternative(false);
      setAlternativeDomain("");

      // Notify parent component of the company change
      if (onCompanyChange) {
        onCompanyChange(alternativeCompany);
      }
    } catch (err) {
      setError("Failed to discover company. Please check the domain and try again.");
      console.error(err);
    }

    setIsSearching(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-2xl shadow-green-500/10 backdrop-blur-xl bg-white overflow-hidden">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-white justify-between"
          >
            <div className="flex items-center gap-3" >
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-lg">Company Discovered!</h3>
                <p className="text-sm text-green-50">We found your business information</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartOver}
              className="text-white hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </motion.div>
        </div>

        <CardContent className="pt-8 pb-8 space-y-6">
          {/* Company Logo and Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-6"
          >
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-slate-200 shadow-lg">
                <img
                  src={getCompanyLogo(company.name, company.domain)}
                  alt={`${company.name} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to UI Avatars if favicon fails
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=128&background=df1d29&color=fff&bold=true`;
                  }}
                />
              </div>
            </div>

            {/* Company Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-3xl font-bold text-[#344547] mb-2 flex items-center gap-2">
                {company.name}
                <Sparkles className="w-5 h-5 text-[#df1d29]" />
              </h3>
              <p className="text-slate-600 mb-3 leading-relaxed">{company.description}</p>
              {company.industry && (
                <Badge variant="secondary" className="text-sm bg-blue-50 text-blue-700 border border-blue-200">
                  {company.industry}
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Products & Services */}
          {company.products && company.products.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-[#df1d29]" />
                <h4 className="font-semibold text-[#344547]">Products & Services</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {company.products.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <Badge className="bg-[#f7f3f0] text-[#344547] border border-slate-200 px-3 py-1.5 hover:bg-slate-100 transition-colors">
                      {product}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          {!showAlternative ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3 pt-4"
            >
              <Button
                size="lg"
                onClick={() => onStartAnalysis(company)}
                className="w-full h-14 text-lg bg-gradient-to-r from-[#df1d29] to-[#c51923] hover:from-[#c51923] hover:to-[#b01820] text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40"
              >
                Continue to Competitor Selection
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="w-full text-[#344547] hover:text-[#df1d29] hover:bg-[#f7f3f0] border-slate-200"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or</span>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => setShowAlternative(true)}
                className="w-full text-[#344547] hover:text-[#df1d29] hover:bg-[#f7f3f0]"
              >
                Wrong company? Search different domain
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-[#344547] mb-2">Analyze Different Company</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Enter the domain of the company you'd like to analyze for this session
                </p>

                <form onSubmit={handleAlternativeSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="company.com"
                    value={alternativeDomain}
                    onChange={(e) => setAlternativeDomain(e.target.value)}
                    className="placeholder:text-slate-400"
                    disabled={isSearching}
                    required
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAlternative(false);
                        setAlternativeDomain("");
                        setError("");
                      }}
                      className="flex-1"
                      disabled={isSearching}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#df1d29] hover:bg-[#c51923]"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowAlternative(false)}
                className="w-full text-[#344547] hover:text-[#df1d29] hover:bg-[#f7f3f0] border-slate-200"
              >
                Back to {company.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
