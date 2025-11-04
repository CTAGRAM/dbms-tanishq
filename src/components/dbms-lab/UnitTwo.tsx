import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator, GitBranch } from "lucide-react";

export function UnitTwo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Relational Algebra ↔ SQL Worksheet
          </CardTitle>
          <CardDescription>
            Interactive demonstrations of RA operations and their SQL equivalents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection & Projection */}
          <div>
            <h3 className="font-semibold mb-3">Selection (σ) & Projection (π)</h3>
            <div className="space-y-2 text-sm bg-muted p-4 rounded-lg font-mono">
              <p className="text-primary">RA: σ<sub>status='AVAILABLE'</sub>(unit)</p>
              <p className="text-accent">SQL: SELECT * FROM unit WHERE status = 'AVAILABLE';</p>
              <hr className="my-2 border-border" />
              <p className="text-primary">RA: π<sub>address,city</sub>(property)</p>
              <p className="text-accent">SQL: SELECT address, city FROM property;</p>
            </div>
          </div>

          {/* Set Operations */}
          <div>
            <h3 className="font-semibold mb-3">Set Operations (∪, ∩, −)</h3>
            <div className="space-y-2 text-sm bg-muted p-4 rounded-lg font-mono">
              <p className="text-primary">RA: active_leases ∪ terminated_leases</p>
              <p className="text-accent">SQL: SELECT * FROM lease WHERE status='active' UNION SELECT * FROM lease WHERE status='terminated';</p>
            </div>
          </div>

          {/* Joins */}
          <div>
            <h3 className="font-semibold mb-3">Join Operations (⋈)</h3>
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs font-semibold mb-1">Inner Join</p>
                <p className="text-xs font-mono text-primary">RA: property ⋈<sub>property_id</sub> unit</p>
                <p className="text-xs font-mono text-accent mt-1">SQL: SELECT * FROM property JOIN unit ON property.property_id = unit.property_id;</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs font-semibold mb-1">Left Outer Join</p>
                <p className="text-xs font-mono text-primary">RA: property ⟕<sub>property_id</sub> unit</p>
                <p className="text-xs font-mono text-accent mt-1">SQL: SELECT * FROM property LEFT JOIN unit ON property.property_id = unit.property_id;</p>
              </div>
            </div>
          </div>

          {/* Division */}
          <div>
            <h3 className="font-semibold mb-3">Division (÷)</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
              <p className="text-primary">RA: tenant_leases ÷ all_property_types</p>
              <p className="text-xs text-muted-foreground">(Tenants who rented units in ALL property types)</p>
              <p className="text-accent mt-2">SQL: SELECT t.tenant_id FROM tenant t WHERE NOT EXISTS (SELECT pt.type FROM ...</p>
            </div>
          </div>

          {/* Aggregation */}
          <div>
            <h3 className="font-semibold mb-3">Grouping & Aggregation (γ)</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
              <p className="text-primary">RA: γ<sub>property_id, SUM(monthly_rent)</sub>(lease)</p>
              <p className="text-accent">SQL: SELECT property_id, SUM(monthly_rent) FROM lease JOIN unit USING(unit_id) GROUP BY property_id;</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equivalence Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Query Equivalence & Optimization
          </CardTitle>
          <CardDescription>
            Demonstrating equivalent query transformations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Rule: Push Selection Down</p>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <p className="text-muted-foreground">Before:</p>
                  <p className="text-destructive">σ<sub>status='active'</sub>(property ⋈ unit)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">After (optimized):</p>
                  <p className="text-accent">property ⋈ σ<sub>status='active'</sub>(unit)</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Filtering before join reduces intermediate result size
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
