import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";

interface Mismatch {
  lease_id: string;
  unit_id: string;
  unit_name: string;
  lease_status: string;
  unit_status: string;
  issue_type: string;
  start_date: string;
  end_date: string;
}

export default function Reports() {
  const [mismatches, setMismatches] = useState<Mismatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  const fetchDataIntegrity = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lease_unit_status_mismatches")
        .select("*");

      if (error) throw error;
      setMismatches(data || []);
    } catch (error) {
      console.error("Error fetching data integrity:", error);
      toast.error("Failed to load data integrity report");
    } finally {
      setLoading(false);
    }
  };

  const fixAllIssues = async () => {
    setFixing(true);
    try {
      // Get all active leases
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

      // Get all units not in active leases
      const { data: allUnits } = await supabase
        .from("unit")
        .select("unit_id");

      const unitsToSetAvailable = allUnits?.filter(
        u => !activeUnitIds.includes(u.unit_id)
      ).map(u => u.unit_id) || [];

      if (unitsToSetAvailable.length > 0) {
        await supabase
          .from("unit")
          .update({ status: "AVAILABLE" })
          .in("unit_id", unitsToSetAvailable);
      }

      toast.success("All data integrity issues resolved!");
      fetchDataIntegrity();
    } catch (error) {
      console.error("Error fixing issues:", error);
      toast.error("Failed to fix data integrity issues");
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    fetchDataIntegrity();
  }, []);

  const hasIssues = mismatches.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Monitor system health and data integrity</p>
        </div>
      </div>

      <Tabs defaultValue="integrity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrity" className="gap-2">
            {hasIssues ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            Data Integrity
          </TabsTrigger>
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lease-Unit Status Monitoring</CardTitle>
                  <CardDescription>
                    Automated checks for data consistency between leases and units
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDataIntegrity}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Running integrity checks...</p>
                </div>
              ) : hasIssues ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">Data Integrity Issues Detected</p>
                        <p className="text-sm text-muted-foreground">
                          {mismatches.length} lease(s) with status mismatches
                        </p>
                      </div>
                    </div>
                    <Button onClick={fixAllIssues} disabled={fixing}>
                      {fixing ? "Fixing..." : "Auto-Fix All"}
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead>Issue Type</TableHead>
                          <TableHead>Lease Status</TableHead>
                          <TableHead>Unit Status</TableHead>
                          <TableHead>Lease Period</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mismatches.map((mismatch) => (
                          <TableRow key={mismatch.lease_id}>
                            <TableCell className="font-medium">{mismatch.unit_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                {mismatch.issue_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{mismatch.lease_status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{mismatch.unit_status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(mismatch.start_date).toLocaleDateString()} - {new Date(mismatch.end_date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Systems Operational</h3>
                  <p className="text-muted-foreground">
                    No data integrity issues detected. All leases and units are properly synchronized.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Additional reporting features coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Financial reports, occupancy trends, and analytics dashboards will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
