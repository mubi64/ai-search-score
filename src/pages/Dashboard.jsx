
import { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PlusCircle, TrendingUp, Eye, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ReportCard from "../components/dashboard/ReportCard";
import VisibilityChart from "../components/dashboard/VisibilityChart";
import MetricsGrid from "@/components/dashboard/MetricsGrid";

export default function Dashboard() {
  const [showAllReports, setShowAllReports] = useState(false);

  const companyId = sessionStorage.getItem('companyId');

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const companies = await apiClient.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', companyId],
    queryFn: () => {
      if (!companyId) return [];
      return apiClient.entities.Report.filter({
        company_id: companyId,
        status: 'completed'
      }, '-analysis_timestamp');
    },
    enabled: !!companyId,
    initialData: [],
  });

  const isLoading = companyLoading || reportsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const completedReports = reports.filter(r => r.status === 'completed');
  const displayedReports = showAllReports ? completedReports : completedReports.slice(0, 5);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#df1d29] via-[#c51923] to-[#344547] bg-clip-text text-transparent mb-2">
              {company?.name || 'My'} Dashboard
            </h1>
            <p className="text-[#344547] text-lg">
              Track your brand's presence across AI platforms over time
            </p>
          </div>
          <Link to={createPageUrl("Start")}>
            <Button size="lg" className="bg-[#df1d29] hover:bg-[#c51923] text-white shadow-lg shadow-red-500/30">
              <PlusCircle className="w-5 h-5 mr-2" />
              New Analysis
            </Button>
          </Link>
        </div>

        {completedReports.length === 0 ? (
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white">
            <CardContent className="py-16 text-center">
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#344547] mb-2">
                No Reports Yet
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Start your first analysis to track your brand's visibility across AI platforms
              </p>
              <Link to={createPageUrl("Start")}>
                <Button size="lg" className="bg-[#df1d29] hover:bg-[#c51923] text-white">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create First Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <MetricsGrid reports={completedReports} />

            {/* Always show Visibility Trends chart */}
            <Card className="border-0 shadow-xl backdrop-blur-xl bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-2xl text-[#344547]">
                  <TrendingUp className="w-6 h-6 text-[#df1d29]" />
                  Visibility Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <VisibilityChart reports={completedReports} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl backdrop-blur-xl bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-2xl text-[#344547]">
                  <Eye className="w-6 h-6 text-[#df1d29]" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  {displayedReports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>

                {completedReports.length > 5 && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllReports(!showAllReports)}
                      className="w-full border-slate-200 text-[#344547] hover:text-[#df1d29] hover:bg-[#f7f3f0]"
                    >
                      {showAllReports ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Show All ({completedReports.length - 5} more)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
