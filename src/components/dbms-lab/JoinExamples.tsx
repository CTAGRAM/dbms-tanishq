import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitMerge } from "lucide-react";

export function JoinExamples() {
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
      }
    },
    {
      type: "SELF JOIN",
      description: "Compare data within the same table",
      example: {
        query: `SELECT 
  p1.address AS property_1,
  p2.address AS property_2,
  p1.city AS common_city,
  ABS(p1.latitude - p2.latitude) + ABS(p1.longitude - p2.longitude) AS distance_approx
FROM property p1
INNER JOIN property p2 ON p1.city = p2.city AND p1.property_id < p2.property_id
WHERE p1.latitude IS NOT NULL AND p2.latitude IS NOT NULL
ORDER BY distance_approx ASC
LIMIT 10;`,
        explanation: "Find pairs of properties in the same city and their approximate distance"
      }
    },
    {
      type: "CROSS JOIN (Useful for Reports)",
      description: "Generate combinations for reporting or analysis",
      example: {
        query: `SELECT 
  p.address,
  dates.month_start,
  COALESCE(SUM(pay.amount), 0) AS revenue
FROM property p
CROSS JOIN (
  SELECT generate_series(
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months'),
    DATE_TRUNC('month', CURRENT_DATE),
    '1 month'::INTERVAL
  ) AS month_start
) dates
LEFT JOIN unit u ON p.property_id = u.property_id
LEFT JOIN lease l ON u.unit_id = l.unit_id
LEFT JOIN payment pay ON l.lease_id = pay.lease_id 
  AND DATE_TRUNC('month', pay.paid_at) = dates.month_start
  AND pay.status = 'paid'
GROUP BY p.property_id, p.address, dates.month_start
ORDER BY p.address, dates.month_start;`,
        explanation: "Generate 6-month revenue report for each property (fills gaps with $0)"
      }
    }
  ];

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
                <div>
                  <h3 className="text-lg font-semibold text-primary">{join.type}</h3>
                  <p className="text-sm text-muted-foreground">{join.description}</p>
                </div>
                
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <pre className="text-xs overflow-x-auto">
                    <code>{join.example.query}</code>
                  </pre>
                </div>
                
                <p className="text-sm text-foreground italic">
                  ✓ {join.example.explanation}
                </p>
                
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
