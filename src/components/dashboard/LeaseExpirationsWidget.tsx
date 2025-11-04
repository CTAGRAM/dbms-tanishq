import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaseExpiration {
  lease_id: string;
  unit_name: string;
  end_date: string;
  tenant_name: string;
  tenant_avatar: string | null;
  status: string;
}

export const LeaseExpirationsWidget = () => {
  const [leases, setLeases] = useState<LeaseExpiration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringLeases();
  }, []);

  const fetchExpiringLeases = async () => {
    try {
      const today = new Date();
      const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from('lease')
        .select(`
          lease_id,
          end_date,
          status,
          unit:unit_id (
            name
          ),
          tenant:tenant_id (
            profiles:profile_id (
              full_name,
              avatar_url
            )
          )
        `)
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', in90Days.toISOString().split('T')[0])
        .eq('status', 'active')
        .order('end_date', { ascending: true })
        .limit(5);

      const formattedLeases = data?.map((lease: any) => ({
        lease_id: lease.lease_id,
        unit_name: lease.unit?.name || 'N/A',
        end_date: lease.end_date,
        tenant_name: lease.tenant?.profiles?.full_name || 'Unknown',
        tenant_avatar: lease.tenant?.profiles?.avatar_url || null,
        status: lease.status,
      })) || [];

      setLeases(formattedLeases);
    } catch (error) {
      console.error('Error fetching expiring leases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiration = (endDate: string) => {
    const today = new Date();
    const expiration = new Date(endDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Lease Expirations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-full h-16" />
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
          <Calendar className="h-5 w-5" />
          Upcoming Lease Expirations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leases.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No leases expiring in the next 90 days
          </p>
        ) : (
          <div className="space-y-4">
            {leases.map((lease) => {
              const daysLeft = getDaysUntilExpiration(lease.end_date);
              return (
                <div
                  key={lease.lease_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={lease.tenant_avatar || undefined} />
                      <AvatarFallback>{getInitials(lease.tenant_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{lease.tenant_name}</p>
                      <p className="text-xs text-muted-foreground">Unit {lease.unit_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={daysLeft <= 30 ? "destructive" : "secondary"}>
                      {daysLeft} days
                    </Badge>
                    <Button size="icon" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
