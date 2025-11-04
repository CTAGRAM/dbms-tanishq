import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitMerge, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UnitThree() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Functional Dependencies & Normalization
          </CardTitle>
          <CardDescription>
            FD analysis and decomposition demonstrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* FD Calculator */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              FD Calculator
              <Badge variant="secondary">BCNF</Badge>
            </h3>
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Example Relation:</strong> PropertyDetails (property_id, address, owner_id, owner_name, city, state)</p>
              <p className="font-mono text-xs text-primary mt-2">
                FDs: property_id → address, city, state, owner_id<br/>
                owner_id → owner_name
              </p>
              <div className="mt-3 p-3 bg-background rounded border">
                <p className="text-xs font-semibold">Candidate Keys:</p>
                <p className="text-xs font-mono">{'{property_id}'}</p>
              </div>
              <div className="mt-2 p-3 bg-background rounded border">
                <p className="text-xs font-semibold">Minimal Cover:</p>
                <p className="text-xs font-mono">
                  property_id → address, city, state, owner_id<br/>
                  owner_id → owner_name
                </p>
              </div>
            </div>
          </div>

          {/* BCNF Decomposition */}
          <div>
            <h3 className="font-semibold mb-3">BCNF Decomposition</h3>
            <div className="space-y-3">
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                <p className="text-sm font-semibold text-destructive mb-2">❌ Before (Not in BCNF)</p>
                <p className="text-xs font-mono">PropertyDetails (property_id, address, owner_id, owner_name, city, state)</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Violation: owner_id → owner_name, but owner_id is not a superkey
                </p>
              </div>

              <div className="text-center text-muted-foreground">↓ Decompose ↓</div>

              <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg">
                <p className="text-sm font-semibold text-accent mb-2">✓ After (BCNF)</p>
                <div className="space-y-1 text-xs font-mono">
                  <p>R1: Property (property_id, address, owner_id, city, state)</p>
                  <p>R2: Owner (owner_id, owner_name)</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ Lossless join: property_id is FK to owner<br/>
                  ✓ Dependency preserving: All FDs maintained
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4NF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            4NF - Multivalued Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Example: Property with Amenities & Policies</p>
              <p className="text-xs font-mono">PropertyInfo (property_id, amenity, policy)</p>
              <p className="text-xs text-muted-foreground mt-2">
                MVD: property_id →→ amenity | property_id →→ policy
              </p>
            </div>

            <div className="text-center text-muted-foreground text-sm">↓ Decompose to 4NF ↓</div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="bg-accent/10 p-3 rounded border border-accent/20">
                <p className="text-xs font-mono">PropertyAmenities (property_id, amenity)</p>
              </div>
              <div className="bg-accent/10 p-3 rounded border border-accent/20">
                <p className="text-xs font-mono">PropertyPolicies (property_id, policy)</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Eliminates redundancy from independent multi-valued attributes</p>
          </div>
        </CardContent>
      </Card>

      {/* 5NF */}
      <Card>
        <CardHeader>
          <CardTitle>5NF - Join Dependencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Example: Agent-Property-Client relationship</p>
              <p className="text-xs font-mono">Assignment (agent_id, property_id, client_id)</p>
              <p className="text-xs text-muted-foreground mt-2">
                JD: *[{`{agent_id, property_id}, {property_id, client_id}, {agent_id, client_id}`}]*
              </p>
            </div>

            <div className="text-center text-muted-foreground text-sm">↓ Decompose to 5NF ↓</div>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="bg-info/10 p-3 rounded border border-info/20">
                <p className="text-xs font-mono">AgentProperty (agent_id, property_id)</p>
              </div>
              <div className="bg-info/10 p-3 rounded border border-info/20">
                <p className="text-xs font-mono">PropertyClient (property_id, client_id)</p>
              </div>
              <div className="bg-info/10 p-3 rounded border border-info/20">
                <p className="text-xs font-mono">AgentClient (agent_id, client_id)</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Lossless join: Original relation = R1 ⋈ R2 ⋈ R3
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
