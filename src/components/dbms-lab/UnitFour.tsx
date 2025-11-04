import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Code, RefreshCw, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UnitFour() {
  const [loading, setLoading] = useState(false);
  const [mvData, setMvData] = useState<any[]>([]);

  const refreshMV = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('refresh_monthly_revenue' as any);
      if (error) throw error;
      toast.success("Materialized view refreshed");
      
      // Fetch updated data
      const { data } = await supabase.from('monthly_revenue_by_property' as any).select('*').limit(5);
      setMvData(data || []);
    } catch (error) {
      console.error("Error refreshing MV:", error);
      toast.error("Failed to refresh materialized view");
    } finally {
      setLoading(false);
    }
  };

  const runLateFeeCalc = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_late_fee', {
        due_date: '2024-01-01',
        amount: 1000
      });
      if (error) throw error;
      toast.success(`Late fee calculated: $${data}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to calculate late fee");
    }
  };

  const runCursorProc = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('process_overdue_payments');
      if (error) throw error;
      toast.success(`Processed ${data?.length || 0} overdue payments`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Domain Integrity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Domain Integrity & Constraints
          </CardTitle>
          <CardDescription>CHECK constraints and ENUM types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-semibold mb-2">payment.method (ENUM)</p>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline">cash</Badge>
                <Badge variant="outline">check</Badge>
                <Badge variant="outline">bank_transfer</Badge>
                <Badge variant="outline">credit_card</Badge>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-semibold mb-2">maintenance_request.category (ENUM)</p>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline">plumbing</Badge>
                <Badge variant="outline">electrical</Badge>
                <Badge variant="outline">hvac</Badge>
                <Badge variant="outline">appliance</Badge>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Domain constraints ensure data validity at the database level
          </p>
        </CardContent>
      </Card>

      {/* Security Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Role-Scoped Security Views
          </CardTitle>
          <CardDescription>Views that enforce access control</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-mono text-sm font-semibold text-primary">tenant_lease_view</p>
              <p className="text-xs text-muted-foreground mt-1">
                Shows only leases for the authenticated tenant
              </p>
              <p className="text-xs font-mono mt-2 text-accent">WHERE tenant.profile_id = auth.uid()</p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-mono text-sm font-semibold text-primary">owner_property_view</p>
              <p className="text-xs text-muted-foreground mt-1">
                Shows only properties owned by the authenticated user
              </p>
              <p className="text-xs font-mono mt-2 text-accent">WHERE owner_id = auth.uid()</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-mono text-sm font-semibold text-primary">ops_maintenance_view</p>
              <p className="text-xs text-muted-foreground mt-1">
                Shows maintenance for user's properties only
              </p>
              <p className="text-xs font-mono mt-2 text-accent">WHERE property.owner_id = auth.uid()</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subqueries */}
      <Card>
        <CardHeader>
          <CardTitle>Nested Subqueries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs font-semibold mb-1">IN Subquery</p>
              <p className="text-xs font-mono">SELECT * FROM property WHERE property_id IN (SELECT property_id FROM unit WHERE status='AVAILABLE');</p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs font-semibold mb-1">EXISTS (Correlated)</p>
              <p className="text-xs font-mono">SELECT * FROM tenant t WHERE EXISTS (SELECT 1 FROM lease l WHERE l.tenant_id = t.tenant_id AND l.status='active');</p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs font-semibold mb-1">ANY/ALL</p>
              <p className="text-xs font-mono">SELECT * FROM unit WHERE rent_amount &gt; ALL (SELECT AVG(rent_amount) FROM unit GROUP BY property_id);</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materialized View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Materialized View Controller</CardTitle>
              <CardDescription>monthly_revenue_by_property</CardDescription>
            </div>
            <Button onClick={refreshMV} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh MV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mvData.length > 0 ? (
            <div className="space-y-2">
              {mvData.map((row, i) => (
                <div key={i} className="text-xs font-mono bg-muted p-2 rounded">
                  {row.address}: ${row.total_revenue} ({row.lease_count} leases)
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click "Refresh MV" to load data</p>
          )}
        </CardContent>
      </Card>

      {/* PL/pgSQL Playground */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            PL/pgSQL Functions & Procedures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-sm font-semibold">calculate_late_fee(date, amount)</p>
              <Button size="sm" variant="outline" onClick={runLateFeeCalc}>
                <Play className="h-3 w-3 mr-1" />
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Scalar function - calculates 5% fee if >5 days overdue</p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-sm font-semibold">process_overdue_payments()</p>
              <Button size="sm" variant="outline" onClick={runCursorProc} disabled={loading}>
                <Play className="h-3 w-3 mr-1" />
                Run
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cursor-based procedure - processes overdue payments with exception handling
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Triggers */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Demonstrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-warning">
              <p className="text-sm font-semibold">BEFORE Trigger: validate_lease_dates()</p>
              <p className="text-xs text-muted-foreground mt-1">
                Validates lease dates before INSERT/UPDATE. Ensures end_date {'>'} start_date and monthly_rent {'>'} 0
              </p>
              <Badge variant="outline" className="mt-2">ROW-LEVEL</Badge>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-info">
              <p className="text-sm font-semibold">AFTER Trigger: notify_maintenance_created()</p>
              <p className="text-xs text-muted-foreground mt-1">
                Logs notification after maintenance request is created
              </p>
              <Badge variant="outline" className="mt-2">ROW-LEVEL</Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              All trigger events are logged in the Operations Console
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
