import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database, Layers, Table } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function UnitOne() {
  const [loading, setLoading] = useState(false);
  const [dictionary, setDictionary] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchDataDictionary();
    fetchInstanceStats();
  }, []);

  const fetchDataDictionary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_table_info' as any);
      if (error) {
        // Fallback: query information_schema directly
        const { data: tables } = await supabase
          .from('information_schema.tables' as any)
          .select('table_name')
          .eq('table_schema', 'public');
        
        setDictionary(tables || []);
      } else {
        setDictionary(data || []);
      }
    } catch (error) {
      console.error("Error fetching data dictionary:", error);
      toast.error("Failed to load data dictionary");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstanceStats = async () => {
    try {
      const tables = ['property', 'unit', 'tenant', 'lease', 'payment', 'maintenance_request'];
      const counts: any = {};

      for (const table of tables) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        counts[table] = count || 0;
      }

      setStats(counts);
    } catch (error) {
      console.error("Error fetching instance stats:", error);
    }
  };

  const downloadCSV = () => {
    const csv = [
      ['Table', 'Column', 'Type', 'Nullable', 'Default'],
      ...dictionary.map(d => [d.table_name, d.column_name, d.data_type, d.is_nullable, d.column_default || ''])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-dictionary.csv';
    a.click();
    toast.success("Data dictionary downloaded");
  };

  const indexes = [
    { name: "idx_lease_tenant_status", columns: "tenant_id, status", table: "lease", justification: "Speeds up filtering leases by tenant and status" },
    { name: "idx_payment_lease_status", columns: "lease_id, status", table: "payment", justification: "Optimizes payment queries by lease and status" },
    { name: "idx_maintenance_status_priority", columns: "status, priority", table: "maintenance_request", justification: "Enables fast filtering by status and priority" },
    { name: "idx_unit_property_status", columns: "property_id, status", table: "unit", justification: "Improves unit lookups by property and availability" },
    { name: "idx_property_owner", columns: "owner_id", table: "property", justification: "Accelerates owner property queries" },
  ];

  return (
    <div className="space-y-6">
      {/* Three-Schema Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Three-Schema Architecture
          </CardTitle>
          <CardDescription>
            Understanding database abstraction layers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">External Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  User views: tenant_lease_view, owner_property_view, ops_maintenance_view
                </p>
                <p className="text-xs mt-2">Role-scoped access to data</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent">
              <CardHeader>
                <CardTitle className="text-lg">Conceptual Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ER Model: property, unit, tenant, lease, payment, maintenance_request
                </p>
                <p className="text-xs mt-2">Logical database design</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-info">
              <CardHeader>
                <CardTitle className="text-lg">Internal Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Physical storage: B-tree indexes, heap tables, TOAST
                </p>
                <p className="text-xs mt-2">Storage implementation</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Data Dictionary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Dictionary
              </CardTitle>
              <CardDescription>
                Complete schema metadata
              </CardDescription>
            </div>
            <Button onClick={downloadCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Data dictionary contains schema information for all tables.</p>
              <p className="mt-2">Click "Download CSV" to export complete metadata.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indexing Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Indexing Plan
          </CardTitle>
          <CardDescription>
            Performance optimization indexes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {indexes.map((idx) => (
              <Card key={idx.name} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm font-medium">{idx.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Table: <span className="font-medium">{idx.table}</span> | 
                        Columns: <span className="font-medium">{idx.columns}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{idx.justification}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instance vs Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Instance vs Schema</CardTitle>
          <CardDescription>
            Current data snapshot (instance) vs structure (schema)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Current Instance (Row Counts)</h3>
              {stats ? (
                <div className="space-y-1 text-sm">
                  {Object.entries(stats).map(([table, count]) => (
                    <div key={table} className="flex justify-between">
                      <span className="font-mono">{table}:</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Schema (Structure)</h3>
              <p className="text-sm text-muted-foreground">
                Schema is defined in database migrations and remains stable unless altered by DDL operations.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                View migrations in <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/migrations/</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
