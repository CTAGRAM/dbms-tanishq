import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

export const MarketingFunnel = () => {
  const funnelData = [
    { stage: "Leads", count: 1000, color: "bg-chart-4" },
    { stage: "Tours", count: 600, color: "bg-chart-1" },
    { stage: "Applications", count: 300, color: "bg-chart-2" },
    { stage: "Leases", count: 150, color: "bg-chart-3" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Marketing Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {funnelData.map((stage, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium">{stage.stage}</div>
              <div className="flex-1">
                <div
                  className={`${stage.color} h-8 rounded flex items-center justify-end px-3 text-white text-sm font-medium transition-all`}
                  style={{ width: `${(stage.count / 1000) * 100}%` }}
                >
                  {stage.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
