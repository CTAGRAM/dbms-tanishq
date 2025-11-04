import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Flame, Zap, Droplet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceRequest {
  request_id: string;
  description: string;
  priority: number;
  status: string;
  created_at: string;
  unit_name: string;
  property_address: string;
}

export const MaintenanceWidget = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      const { data } = await supabase
        .from('maintenance_request')
        .select(`
          request_id,
          description,
          priority,
          status,
          created_at,
          unit:unit_id (
            name,
            property:property_id (
              address
            )
          )
        `)
        .in('status', ['open', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5);

      const formattedRequests = data?.map((req: any) => ({
        request_id: req.request_id,
        description: req.description,
        priority: req.priority,
        status: req.status,
        created_at: req.created_at,
        unit_name: req.unit?.name || 'N/A',
        property_address: req.unit?.property?.address || 'Unknown',
      })) || [];

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) return <Flame className="h-4 w-4 text-destructive" />;
    if (priority === 3) return <Zap className="h-4 w-4 text-warning" />;
    return <Droplet className="h-4 w-4 text-primary" />;
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return "Urgent";
    if (priority === 3) return "High";
    return "Normal";
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Active Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-full h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Active Maintenance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active maintenance requests
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.request_id}
                className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex gap-3 flex-1">
                  <div className="mt-1">
                    {getPriorityIcon(request.priority)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-1">{request.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.property_address} • Unit {request.unit_name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getPriorityLabel(request.priority)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(request.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Assign
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
