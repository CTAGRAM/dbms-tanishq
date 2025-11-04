import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface PropertyPerformance {
  name: string;
  revenue: number;
  percentage: number;
}

export const TopPerformingProperties = () => {
  const [properties, setProperties] = useState<PropertyPerformance[]>([]);

  useEffect(() => {
    fetchTopProperties();
  }, []);

  const fetchTopProperties = async () => {
    const { data } = await supabase
      .from('property')
      .select('address, property_id')
      .limit(4);

    if (data) {
      const mockPerformance = data.map((prop, idx) => ({
        name: prop.address,
        revenue: 50000 - (idx * 10000),
        percentage: 100 - (idx * 20),
      }));
      setProperties(mockPerformance);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Performing Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {properties.map((prop, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{prop.name}</span>
              <span className="text-muted-foreground">
                ${prop.revenue.toLocaleString()}
              </span>
            </div>
            <Progress value={prop.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
