import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Globe, ArrowUp, ArrowDown } from "lucide-react";

export default function MetricsGrid({ reports }) {
  const latestReport = reports[0];
  const previousReport = reports[1];

  const calculateChange = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const metrics = [
    {
      title: "Latest Score",
      subtitle: "Overall Visibility",
      value: latestReport?.overall_visibility_score || 0,
      change: previousReport ? calculateChange(
        latestReport.overall_visibility_score,
        previousReport.overall_visibility_score
      ) : 0,
      icon: TrendingUp,
      iconColorClass: "from-[#df1d29] to-[#c51923]",
      bgAccentClass: "from-[#df1d29]/10",
      valueColorClass: "text-[#df1d29]",
      color: "from-blue-500 to-indigo-500" // This color property is no longer used in the JSX below due to the brand color update
    },
    {
      title: "Reports Run",
      subtitle: "Total Analyses",
      value: reports.length,
      icon: Globe,
      iconColorClass: "from-[#344547] to-[#1e2a2c]",
      bgAccentClass: "from-[#344547]/10",
      valueColorClass: "text-[#344547]",
      color: "from-orange-500 to-red-500" // This color property is no longer used in the JSX below due to the brand color update
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="border-0 shadow-lg backdrop-blur-xl bg-white overflow-hidden relative">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.bgAccentClass} to-transparent rounded-bl-full`} />
          <CardContent className="p-8 relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.iconColorClass} flex items-center justify-center shadow-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-600">{metric.title}</h3>
                  <p className="text-xs text-slate-500">{metric.subtitle}</p>
                </div>
              </div>

              {metric.change !== undefined && (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm ${metric.change > 0
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}>
                  {metric.change > 0 ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
            <div className={`text-3xl font-bold ${metric.valueColorClass} mb-1`}>
              {metric.value}
            </div>
            <div className="text-sm text-slate-600">
              {metric.title}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}