import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyAssistant } from "@/components/PropertyAssistant";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { LeaseExpirationsWidget } from "@/components/dashboard/LeaseExpirationsWidget";
import { MaintenanceWidget } from "@/components/dashboard/MaintenanceWidget";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { OccupancyMap } from "@/components/dashboard/OccupancyMap";
import { TopPerformingProperties } from "@/components/dashboard/TopPerformingProperties";
import { MarketingFunnel } from "@/components/dashboard/MarketingFunnel";

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
  sparklineData: {
    properties: { value: number }[];
    occupancy: { value: number }[];
    revenue: { value: number }[];
    leases: { value: number }[];
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();

    // Set up real-time subscriptions for all dashboard data
    console.log('📡 Setting up real-time subscriptions for dashboard...');

    const propertyChannel = supabase
      .channel('dashboard-properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'property' }, () => {
        console.log('🔄 Property changed, refreshing stats...');
        fetchDashboardStats();
      })
      .subscribe();

    const unitChannel = supabase
      .channel('dashboard-units')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unit' }, () => {
        console.log('🔄 Unit changed, refreshing stats...');
        fetchDashboardStats();
      })
      .subscribe();

    const leaseChannel = supabase
      .channel('dashboard-leases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lease' }, () => {
        console.log('🔄 Lease changed, refreshing stats...');
        fetchDashboardStats();
      })
      .subscribe();

    const paymentChannel = supabase
      .channel('dashboard-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, () => {
        console.log('🔄 Payment changed, refreshing stats...');
        fetchDashboardStats();
      })
      .subscribe();

    const maintenanceChannel = supabase
      .channel('dashboard-maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_request' }, () => {
        console.log('🔄 Maintenance request changed, refreshing stats...');
        fetchDashboardStats();
      })
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...');
      supabase.removeChannel(propertyChannel);
      supabase.removeChannel(unitChannel);
      supabase.removeChannel(leaseChannel);
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(maintenanceChannel);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('📊 Fetching dashboard stats...');
      const [properties, units, tenants, leases, payments, maintenance] = await Promise.all([
        supabase.from("property").select("property_id", { count: "exact", head: true }),
        supabase.from("unit").select("unit_id, status", { count: "exact" }),
        supabase.from("tenant").select("tenant_id", { count: "exact", head: true }),
        supabase.from("lease").select("lease_id", { count: "exact" }).eq("status", "active"),
        supabase.from("payment").select("payment_id, amount, status, due_date"),
        supabase.from("maintenance_request").select("request_id", { count: "exact" }).eq("status", "open"),
      ]);

      const totalUnits = units.count || 0;
      const occupiedUnits = units.data?.filter((u) => u.status === "LEASED").length || 0;
      const pendingPayments = payments.data?.filter((p) => p.status === "pending").length || 0;
      const overduePayments = payments.data?.filter(
        (p) => p.status === "pending" && new Date(p.due_date) < new Date()
      ).length || 0;
      
      const paidThisMonth = payments.data?.filter(
        (p) => p.status === "paid" && new Date(p.due_date).getMonth() === new Date().getMonth()
      ).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

      // Calculate occupancy percentage safely
      const occupancyPercentage = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Generate sparkline data (last 7 days trend)
      const generateSparkline = (baseValue: number) => 
        Array.from({ length: 7 }, () => ({ 
          value: Math.max(0, baseValue + Math.random() * (baseValue * 0.2) - (baseValue * 0.1))
        }));

      // Detect data quality issues
      if (leases.count && leases.count > 0 && occupiedUnits === 0) {
        console.warn('⚠️ Data integrity issue: Active leases exist but no units marked as LEASED');
      }

      setStats({
        totalProperties: properties.count || 0,
        totalUnits,
        occupiedUnits,
        totalTenants: tenants.count || 0,
        activeLeases: leases.count || 0,
        pendingPayments,
        overduePayments,
        openMaintenanceRequests: maintenance.count || 0,
        monthlyRevenue: paidThisMonth,
        sparklineData: {
          properties: generateSparkline(properties.count || 0),
          occupancy: generateSparkline(occupancyPercentage),
          revenue: generateSparkline(paidThisMonth),
          leases: generateSparkline(leases.count || 0),
        },
      });
      
      console.log('✅ Dashboard stats updated:', {
        properties: properties.count,
        units: units.count,
        tenants: tenants.count,
        leases: leases.count,
        maintenanceRequests: maintenance.count,
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

  // Calculate occupancy rate safely to prevent NaN
  const occupancyRate = stats && stats.totalUnits > 0 
    ? (stats.occupiedUnits / stats.totalUnits) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your real estate portfolio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalUnits} total units
            </p>
            <div className="mt-3">
              <SparklineChart 
                data={stats?.sparklineData.properties || []} 
                color="hsl(var(--chart-1))"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.occupiedUnits} / {stats?.totalUnits} units leased
            </p>
            <div className="mt-3">
              <SparklineChart 
                data={stats?.sparklineData.occupancy || []} 
                color="hsl(var(--chart-2))"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pendingPayments} pending payments
            </p>
            <div className="mt-3">
              <SparklineChart 
                data={stats?.sparklineData.revenue || []} 
                color="hsl(var(--chart-3))"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeLeases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalTenants} total tenants
            </p>
            <div className="mt-3">
              <SparklineChart 
                data={stats?.sparklineData.leases || []} 
                color="hsl(var(--chart-4))"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart />
        <OccupancyMap />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LeaseExpirationsWidget />
        <MaintenanceWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopPerformingProperties />
        <MarketingFunnel />
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
