import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const MarketingFunnel = () => {
  const [funnelData, setFunnelData] = useState([
    { stage: "Leads", count: 0, color: "bg-chart-4" },
    { stage: "Tours", count: 0, color: "bg-chart-1" },
    { stage: "Applications", count: 0, color: "bg-chart-2" },
    { stage: "Leases", count: 0, color: "bg-chart-3" },
  ]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(1000);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      // Get total available + leased units (potential leads)
      const { data: units } = await supabase
        .from('unit')
        .select('unit_id, status');
      
      const totalLeads = units?.length || 0;

      // Get active + terminated leases (applications that converted)
      const { data: leases } = await supabase
        .from('lease')
        .select('lease_id, status');
      
      const activeLeases = leases?.filter(l => l.status === 'active').length || 0;
      const totalApplications = leases?.length || 0;

      // Simulate tours as 60% of leads (in real app, track separately)
      const tours = Math.round(totalLeads * 0.6);

      const max = Math.max(totalLeads, 100);
      
      setMaxCount(max);
      setFunnelData([
        { stage: "Leads", count: totalLeads, color: "bg-chart-4" },
        { stage: "Tours", count: tours, color: "bg-chart-1" },
        { stage: "Applications", count: totalApplications, color: "bg-chart-2" },
        { stage: "Leases", count: activeLeases, color: "bg-chart-3" },
      ]);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Marketing Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-32" />
        </CardContent>
      </Card>
    );
  }

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
                  style={{ width: `${maxCount > 0 ? (stage.count / maxCount) * 100 : 0}%`, minWidth: stage.count > 0 ? '60px' : '0' }}
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
