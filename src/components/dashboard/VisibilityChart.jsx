import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, subMonths, subYears, isAfter, differenceInDays, differenceInMonths, differenceInYears } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VisibilityChart({ reports }) {
  const [timeRange, setTimeRange] = useState("lifetime");
  const hasInitialized = useRef(false);

  // Determine the earliest report date
  const sortedReports = [...reports].sort((a, b) => new Date(a.analysis_timestamp) - new Date(b.analysis_timestamp));
  const earliestReportDate = sortedReports.length > 0 ? new Date(sortedReports[0].analysis_timestamp) : null;
  const now = new Date();

  // Determine availability of time ranges
  const is7dAvailable = earliestReportDate && differenceInDays(now, earliestReportDate) >= 7;
  const is30dAvailable = earliestReportDate && differenceInDays(now, earliestReportDate) >= 30;
  const is6mAvailable = earliestReportDate && differenceInMonths(now, earliestReportDate) >= 6;
  const is1yAvailable = earliestReportDate && differenceInYears(now, earliestReportDate) >= 1;

  // Set initial timeRange based on what's available (only on first load)
  useEffect(() => {
    if (reports.length === 0 || hasInitialized.current) {
      return;
    }

    // Auto-select the best available default only on initial load
    if (is30dAvailable) {
      setTimeRange("30d");
    } else if (is7dAvailable) {
      setTimeRange("7d");
    } else {
      setTimeRange("lifetime");
    }

    hasInitialized.current = true;
  }, [reports.length, is7dAvailable, is30dAvailable]);

  // Filter reports based on time range
  const getFilteredReports = () => {
    if (reports.length === 0) {
      return [];
    }

    let cutoffDate;

    switch (timeRange) {
      case "7d":
        cutoffDate = subDays(now, 7);
        break;
      case "30d":
        cutoffDate = subDays(now, 30);
        break;
      case "6m":
        cutoffDate = subMonths(now, 6);
        break;
      case "1y":
        cutoffDate = subYears(now, 1);
        break;
      case "lifetime":
        return sortedReports;
      default:
        return sortedReports;
    }

    return sortedReports.filter(report =>
      isAfter(new Date(report.analysis_timestamp), cutoffDate)
    );
  };

  const filteredReports = getFilteredReports();

  // Format date based on time range
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    switch (timeRange) {
      case "7d":
      case "30d":
        return format(date, 'MMM d');
      case "6m":
        return format(date, 'MMM d');
      case "1y":
        return format(date, 'MMM yyyy');
      case "lifetime":
        return format(date, 'MMM d, yy');
      default:
        return format(date, 'MMM d');
    }
  };

  // Parse score safely - handles strings, nulls, and numbers
  const parseScore = (score) => {
    if (score === null || score === undefined) return 0;
    return typeof score === 'string' ? parseFloat(score) : score;
  };

  const chartData = filteredReports.map(report => ({
    date: formatDate(report.analysis_timestamp),
    overall: parseScore(report.overall_visibility_score),
    chatgpt: parseScore(report.chatgpt_visibility),
    gemini: parseScore(report.gemini_visibility),
    perplexity: parseScore(report.perplexity_visibility),
    google: parseScore(report.google_ai_overview_visibility),
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList className="bg-slate-100">
            <TabsTrigger
              value="7d"
              disabled={!is7dAvailable}
              className="data-[state=active]:bg-white data-[state=active]:text-[#344547] text-slate-600"
            >
              7 Days
            </TabsTrigger>
            <TabsTrigger
              value="30d"
              disabled={!is30dAvailable}
              className="data-[state=active]:bg-white data-[state=active]:text-[#344547] text-slate-600"
            >
              30 Days
            </TabsTrigger>
            <TabsTrigger
              value="6m"
              disabled={!is6mAvailable}
              className="data-[state=active]:bg-white data-[state=active]:text-[#344547] text-slate-600"
            >
              6 Months
            </TabsTrigger>
            <TabsTrigger
              value="1y"
              disabled={!is1yAvailable}
              className="data-[state=active]:bg-white data-[state=active]:text-[#344547] text-slate-600"
            >
              1 Year
            </TabsTrigger>
            <TabsTrigger
              value="lifetime"
              className="data-[state=active]:bg-white data-[state=active]:text-[#344547] text-slate-600"
            >
              Lifetime
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          No reports in this time range
        </div>
      ) : (
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="overall"
                stroke="#df1d29"
                strokeWidth={3}
                name="Overall"
                dot={{ fill: '#df1d29', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="chatgpt"
                stroke="#10b981"
                strokeWidth={2}
                name="ChatGPT"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="gemini"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Gemini"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="perplexity"
                stroke="#a855f7"
                strokeWidth={2}
                name="Perplexity"
                dot={{ fill: '#a855f7', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="google"
                stroke="#ef4444"
                strokeWidth={2}
                name="Google AI"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}