import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitMerge, Play } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function JoinExamples() {
  const [results, setResults] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const executeQuery = async (index: number, queryFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [index]: true }));
    try {
      const data = await queryFn();
      setResults(prev => ({ ...prev, [index]: data }));
      toast({
        title: "Query Executed",
        description: `Returned ${data.length} row(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const joinExamples = [
    {
      type: "INNER JOIN",
      description: "Returns only matching records from both tables",
      example: {
        query: `SELECT 
  u.name AS unit_name,
  p.address,
  p.city,
  u.rent_amount
FROM unit u
INNER JOIN property p ON u.property_id = p.property_id
WHERE u.status = 'AVAILABLE';`,
        explanation: "Get all available units with their property addresses"
      },
      executeFn: async () => {
        const { data, error } = await supabase
          .from('unit')
          .select('name, rent_amount, property(address, city)')
          .eq('status', 'AVAILABLE');
        if (error) throw error;
        return data.map((u: any) => ({
          unit_name: u.name,
          address: u.property?.address || 'N/A',
          city: u.property?.city || 'N/A',
          rent_amount: u.rent_amount
        }));
      }
    },
    {
      type: "LEFT JOIN",
      description: "Returns all records from left table and matching records from right table",
      example: {
        query: `SELECT 
  p.address,
  p.city,
  COUNT(u.unit_id) AS total_units,
  SUM(CASE WHEN u.status = 'LEASED' THEN 1 ELSE 0 END) AS leased_units
FROM property p
LEFT JOIN unit u ON p.property_id = u.property_id
GROUP BY p.property_id, p.address, p.city;`,
        explanation: "List all properties with their unit counts (even if they have no units)"
      },
      executeFn: async () => {
        const { data, error } = await supabase
          .from('property')
          .select('address, city, unit(unit_id, status)');
        if (error) throw error;
        return data.map((p: any) => ({
          address: p.address,
          city: p.city,
          total_units: p.unit?.length || 0,
          leased_units: p.unit?.filter((u: any) => u.status === 'LEASED').length || 0
        }));
      }
    },
    {
      type: "INNER JOIN (Multiple Tables)",
      description: "Join three or more tables to get comprehensive data",
      example: {
        query: `SELECT 
  pr.full_name AS tenant_name,
  u.name AS unit_name,
  p.address,
  l.monthly_rent,
  l.start_date,
  l.end_date
FROM lease l
INNER JOIN unit u ON l.unit_id = u.unit_id
INNER JOIN property p ON u.property_id = p.property_id
INNER JOIN tenant t ON l.tenant_id = t.tenant_id
INNER JOIN profiles pr ON t.profile_id = pr.id
WHERE l.status = 'active';`,
        explanation: "Get complete lease information with tenant, unit, and property details"
      },
      executeFn: async () => {
        const { data, error } = await supabase
          .from('lease')
          .select('monthly_rent, start_date, end_date, unit(name, property(address)), tenant(profile_id, profiles(full_name))')
          .eq('status', 'active');
        if (error) throw error;
        return data.map((l: any) => ({
          tenant_name: l.tenant?.profiles?.full_name || 'N/A',
          unit_name: l.unit?.name || 'N/A',
          address: l.unit?.property?.address || 'N/A',
          monthly_rent: l.monthly_rent,
          start_date: l.start_date,
          end_date: l.end_date
        }));
      }
    },
    {
      type: "LEFT JOIN (Payment Status)",
      description: "Show all leases with their payment status",
      example: {
        query: `SELECT 
  pr.full_name AS tenant_name,
  u.name AS unit_name,
  l.monthly_rent,
  COUNT(pay.payment_id) AS total_payments,
  SUM(CASE WHEN pay.status = 'paid' THEN 1 ELSE 0 END) AS paid_payments,
  SUM(CASE WHEN pay.status = 'pending' THEN 1 ELSE 0 END) AS pending_payments
FROM lease l
INNER JOIN tenant t ON l.tenant_id = t.tenant_id
INNER JOIN profiles pr ON t.profile_id = pr.id
INNER JOIN unit u ON l.unit_id = u.unit_id
LEFT JOIN payment pay ON l.lease_id = pay.lease_id
GROUP BY pr.full_name, u.name, l.monthly_rent;`,
        explanation: "View lease payment summary (includes leases with no payments)"
      },
      executeFn: async () => {
        const { data, error } = await supabase
          .from('lease')
          .select('monthly_rent, unit(name), tenant(profile_id, profiles(full_name)), payment(payment_id, status)');
        if (error) throw error;
        return data.map((l: any) => ({
          tenant_name: l.tenant?.profiles?.full_name || 'N/A',
          unit_name: l.unit?.name || 'N/A',
          monthly_rent: l.monthly_rent,
          total_payments: l.payment?.length || 0,
          paid_payments: l.payment?.filter((p: any) => p.status === 'paid').length || 0,
          pending_payments: l.payment?.filter((p: any) => p.status === 'pending').length || 0
        }));
      }
    },
    {
      type: "INNER JOIN (Maintenance)",
      description: "Get maintenance requests with property and unit details",
      example: {
        query: `SELECT 
  p.address,
  p.city,
  u.name AS unit_name,
  m.category,
  m.priority,
  m.status,
  m.description,
  m.estimated_cost,
  m.created_at
FROM maintenance_request m
INNER JOIN unit u ON m.unit_id = u.unit_id
INNER JOIN property p ON u.property_id = p.property_id
WHERE m.status IN ('open', 'in_progress')
ORDER BY m.priority ASC, m.created_at DESC;`,
        explanation: "List all open maintenance requests with location details"
      },
      executeFn: async () => {
        const { data, error } = await supabase
          .from('maintenance_request')
          .select('category, priority, status, description, estimated_cost, created_at, unit(name, property(address, city))')
          .in('status', ['open', 'in_progress'])
          .order('priority', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map((m: any) => ({
          address: m.unit?.property?.address || 'N/A',
          city: m.unit?.property?.city || 'N/A',
          unit_name: m.unit?.name || 'N/A',
          category: m.category,
          priority: m.priority,
          status: m.status,
          description: m.description?.substring(0, 50) + '...',
          estimated_cost: m.estimated_cost || 0,
          created_at: new Date(m.created_at).toLocaleDateString()
        }));
      }
    },
    {
      type: "LEFT JOIN (Revenue Analysis)",
      description: "Calculate property revenue including properties with no income",
      example: {
        query: `SELECT 
  p.address,
  p.city,
  p.type,
  COUNT(u.unit_id) AS total_units,
  COUNT(l.lease_id) AS active_leases,
  COALESCE(SUM(l.monthly_rent), 0) AS monthly_revenue
FROM property p
LEFT JOIN unit u ON p.property_id = u.property_id
LEFT JOIN lease l ON u.unit_id = l.unit_id AND l.status = 'active'
GROUP BY p.property_id, p.address, p.city, p.type
ORDER BY monthly_revenue DESC;`,
        explanation: "Calculate monthly revenue for all properties (including those with $0)"
      },
      executeFn: async () => {
        const { data, error } = await supabase
          .from('property')
          .select('address, city, type, unit(unit_id, lease!inner(lease_id, monthly_rent, status))');
        if (error) throw error;
        return data.map((p: any) => {
          const activeLeases = p.unit?.flatMap((u: any) => 
            u.lease?.filter((l: any) => l.status === 'active') || []
          ) || [];
          return {
            address: p.address,
            city: p.city,
            type: p.type,
            total_units: p.unit?.length || 0,
            active_leases: activeLeases.length,
            monthly_revenue: activeLeases.reduce((sum: number, l: any) => sum + Number(l.monthly_rent || 0), 0)
          };
        });
      }
    }
  ];

  const renderResults = (index: number) => {
    const data = results[index];
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
      <div className="mt-4 border rounded-lg overflow-hidden">
        <div className="bg-muted p-2 text-sm font-semibold">
          Query Results ({data.length} rows)
        </div>
        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="capitalize">
                    {col.replace(/_/g, ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col}>
                      {typeof row[col] === 'number' && col.includes('revenue')
                        ? `$${row[col].toLocaleString()}`
                        : row[col]?.toString() || 'N/A'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            <CardTitle>SQL JOIN Operations</CardTitle>
          </div>
          <CardDescription>
            Predefined JOIN examples using the Property Management database schema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {joinExamples.map((join, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{join.type}</h3>
                    <p className="text-sm text-muted-foreground">{join.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => executeQuery(index, join.executeFn)}
                    disabled={loading[index]}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {loading[index] ? "Running..." : "Execute"}
                  </Button>
                </div>
                
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <pre className="text-xs overflow-x-auto">
                    <code>{join.example.query}</code>
                  </pre>
                </div>
                
                <p className="text-sm text-foreground italic">
                  ✓ {join.example.explanation}
                </p>

                {loading[index] && (
                  <Skeleton className="w-full h-32" />
                )}

                {renderResults(index)}
                
                {index < joinExamples.length - 1 && (
                  <div className="border-t pt-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>JOIN Types Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">INNER JOIN</h4>
              <p className="text-sm text-muted-foreground">
                Returns rows when there's a match in BOTH tables
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">LEFT JOIN (LEFT OUTER JOIN)</h4>
              <p className="text-sm text-muted-foreground">
                Returns ALL rows from left table + matching rows from right table
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">RIGHT JOIN (RIGHT OUTER JOIN)</h4>
              <p className="text-sm text-muted-foreground">
                Returns ALL rows from right table + matching rows from left table
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">FULL OUTER JOIN</h4>
              <p className="text-sm text-muted-foreground">
                Returns ALL rows when there's a match in EITHER table
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">CROSS JOIN</h4>
              <p className="text-sm text-muted-foreground">
                Returns Cartesian product of both tables (all combinations)
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">SELF JOIN</h4>
              <p className="text-sm text-muted-foreground">
                Join a table to itself to compare rows within the same table
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
