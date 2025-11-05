import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Mismatch {
  lease_id: string;
  unit_id: string;
  unit_name: string;
  lease_status: string;
  unit_status: string;
  issue_type: string;
}

export const DataQualityWidget = () => {
  const [mismatches, setMismatches] = useState<Mismatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  const fetchMismatches = async () => {
    try {
      const { data, error } = await supabase
        .from("lease_unit_status_mismatches")
        .select("*");

      if (error) throw error;
      setMismatches(data || []);
    } catch (error) {
      console.error("Error fetching mismatches:", error);
    } finally {
      setLoading(false);
    }
  };

  const fixDataIntegrity = async () => {
    setFixing(true);
    try {
      // Sync all unit statuses based on active leases
      const { data: activeLeases } = await supabase
        .from("lease")
        .select("unit_id")
        .eq("status", "active");

      const activeUnitIds = activeLeases?.map(l => l.unit_id) || [];

      // Update units with active leases to LEASED
      if (activeUnitIds.length > 0) {
        await supabase
          .from("unit")
          .update({ status: "LEASED" })
          .in("unit_id", activeUnitIds);
      }

      // Update units without active leases to AVAILABLE
      await supabase
        .from("unit")
        .update({ status: "AVAILABLE" })
        .not("unit_id", "in", `(${activeUnitIds.join(",")})`);

      toast.success("Data integrity restored!");
      fetchMismatches();
    } catch (error) {
      console.error("Error fixing data:", error);
      toast.error("Failed to fix data integrity issues");
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    fetchMismatches();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = mismatches.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {hasIssues ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            Data Quality
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchMismatches}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasIssues ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status Mismatches</span>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  {mismatches.length} found
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Some leases and units have inconsistent statuses
              </p>
            </div>
            <Button
              size="sm"
              onClick={fixDataIntegrity}
              disabled={fixing}
              className="w-full"
            >
              {fixing ? "Fixing..." : "Auto-Fix Issues"}
            </Button>
          </>
        ) : (
          <div className="text-center py-2">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-sm font-medium">All Systems Normal</p>
            <p className="text-xs text-muted-foreground">No data integrity issues detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
