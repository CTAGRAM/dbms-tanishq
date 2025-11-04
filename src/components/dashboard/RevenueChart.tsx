import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart } from "@/components/charts/AreaChart";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const RevenueChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Generate last 6 months of data
      const months = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        // Get payments for this month
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
        
        const { data: payments } = await supabase
          .from('payment')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', startDate)
          .lte('paid_at', endDate);

        const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const expenses = revenue * 0.3; // Simulate 30% expenses

        months.push({
          date: monthName,
          revenue: Math.round(revenue),
          expenses: Math.round(expenses),
        });
      }

      setData(months);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs. Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs. Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <AreaChart
          data={data}
          dataKeys={[
            { key: "revenue", color: "hsl(var(--chart-1))", label: "Revenue" },
            { key: "expenses", color: "hsl(var(--chart-2))", label: "Expenses" },
          ]}
        />
      </CardContent>
    </Card>
  );
};
