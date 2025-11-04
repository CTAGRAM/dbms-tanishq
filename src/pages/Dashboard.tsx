import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyAssistant } from "@/components/PropertyAssistant";

interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  totalTenants: number;
  activeLeases: number;
  pendingPayments: number;
  overduePayments: number;
  openMaintenanceRequests: number;
  monthlyRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [properties, units, tenants, leases, payments, maintenance] = await Promise.all([
        supabase.from("property").select("property_id", { count: "exact", head: true }),
        supabase.from("unit").select("unit_id, status", { count: "exact" }),
        supabase.from("tenant").select("tenant_id", { count: "exact", head: true }),
        supabase.from("lease").select("lease_id", { count: "exact" }).eq("status", "active"),
        supabase.from("payment").select("payment_id, amount, status, due_date"),
        supabase.from("maintenance_request").select("request_id", { count: "exact" }).eq("status", "open"),
      ]);

      const occupiedUnits = units.data?.filter((u) => u.status === "LEASED").length || 0;
      const pendingPayments = payments.data?.filter((p) => p.status === "pending").length || 0;
      const overduePayments = payments.data?.filter(
        (p) => p.status === "pending" && new Date(p.due_date) < new Date()
      ).length || 0;
      
      const paidThisMonth = payments.data?.filter(
        (p) => p.status === "paid" && new Date(p.due_date).getMonth() === new Date().getMonth()
      ).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

      setStats({
        totalProperties: properties.count || 0,
        totalUnits: units.count || 0,
        occupiedUnits,
        totalTenants: tenants.count || 0,
        activeLeases: leases.count || 0,
        pendingPayments,
        overduePayments,
        openMaintenanceRequests: maintenance.count || 0,
        monthlyRevenue: paidThisMonth,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const occupancyRate = stats ? (stats.occupiedUnits / stats.totalUnits) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your real estate portfolio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalUnits} total units
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.occupiedUnits} / {stats?.totalUnits} units leased
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pendingPayments} pending payments
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeLeases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalTenants} total tenants
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats?.overduePayments}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Open Maintenance Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats?.openMaintenanceRequests}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Pending assignment or resolution
            </p>
          </CardContent>
        </Card>
      </div>

      <PropertyAssistant />
    </div>
  );
}
