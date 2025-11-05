import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, X, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddLeaseDialog } from "@/components/leases/AddLeaseDialog";
import { ViewLeaseDialog } from "@/components/leases/ViewLeaseDialog";
import { TerminateLeaseDialog } from "@/components/leases/TerminateLeaseDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateRandomLease } from "@/lib/seedData";
import { toast } from "sonner";

interface Lease {
  lease_id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit: number;
  status: string;
  unit: {
    name: string;
    property: {
      address: string;
    };
  };
  tenant: {
    profiles: {
      full_name: string;
      email: string;
      phone: string;
    };
  };
  payment?: Array<{
    payment_id: string;
    amount: number;
    due_date: string;
    status: string;
    paid_at: string | null;
  }>;
}

export default function Leases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingLease, setViewingLease] = useState<Lease | null>(null);
  const [terminatingLeaseId, setTerminatingLeaseId] = useState<string | null>(null);
  const [terminatingUnitId, setTerminatingUnitId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      const { data, error } = await supabase
        .from("lease")
        .select(`
          *,
          unit (name, property (address)),
          tenant (profiles (full_name, email, phone)),
          payment (payment_id, amount, due_date, status, paid_at)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeases(data || []);
    } catch (error) {
      console.error("Error fetching leases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = (leaseId: string, unitId: string) => {
    setTerminatingLeaseId(leaseId);
    setTerminatingUnitId(unitId);
  };

  const handleActivateLease = async (lease: Lease) => {
    try {
      const { error } = await supabase.rpc("sp_confirm_lease", {
        p_unit_id: lease.unit_id,
        p_tenant_id: lease.tenant_id,
        p_start_date: lease.start_date,
        p_end_date: lease.end_date,
        p_deposit: lease.deposit || 0,
      });

      if (error) throw error;

      // Delete the draft lease
      await supabase.from("lease").delete().eq("lease_id", lease.lease_id);

      toast.success("Lease activated successfully!");
      fetchLeases();
    } catch (error) {
      console.error("Error activating lease:", error);
      toast.error("Failed to activate lease");
    }
  };

  const generateRandomLeases = async (count: number) => {
    try {
      // Get available units and tenants
      const { data: units } = await supabase
        .from("unit")
        .select("unit_id")
        .eq("status", "AVAILABLE")
        .limit(count);

      const { data: tenants } = await supabase
        .from("tenant")
        .select("tenant_id")
        .limit(count);

      if (!units?.length || !tenants?.length) {
        toast.error("Need available units and tenants to create leases");
        return;
      }

      const leasesToCreate = Math.min(count, units.length, tenants.length);
      
      // Generate lease data (all as drafts)
      const leasesData = Array.from({ length: leasesToCreate }, (_, i) =>
        generateRandomLease(units[i].unit_id, tenants[i].tenant_id)
      );

      // Insert leases as drafts
      const { data: insertedLeases, error: insertError } = await supabase
        .from("lease")
        .insert(leasesData)
        .select("lease_id, unit_id, tenant_id, start_date, end_date, deposit");

      if (insertError) throw insertError;

      // Randomly activate 70% of leases using sp_confirm_lease
      let activatedCount = 0;
      if (insertedLeases) {
        const leasesToActivate = insertedLeases.filter(() => Math.random() < 0.7);
        
        for (const lease of leasesToActivate) {
          try {
            const { error: confirmError } = await supabase.rpc("sp_confirm_lease", {
              p_unit_id: lease.unit_id,
              p_tenant_id: lease.tenant_id,
              p_start_date: lease.start_date,
              p_end_date: lease.end_date,
              p_deposit: lease.deposit || 0,
            });
            
            if (!confirmError) {
              activatedCount++;
              // Delete the draft lease since sp_confirm_lease creates a new active one
              await supabase.from("lease").delete().eq("lease_id", lease.lease_id);
            }
          } catch (confirmError) {
            console.warn("Failed to activate lease:", confirmError);
          }
        }
      }

      toast.success(`Generated ${leasesToCreate} leases (${activatedCount} active, ${leasesToCreate - activatedCount} drafts)`);
      fetchLeases();
    } catch (error) {
      console.error("Error generating leases:", error);
      toast.error("Failed to generate leases");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      active: "bg-accent text-accent-foreground",
      ended: "bg-warning text-warning-foreground",
      terminated: "bg-destructive text-destructive-foreground",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leases</h1>
          <p className="text-muted-foreground mt-1">Manage lease agreements and contracts</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Sample Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => generateRandomLeases(5)}>
                Add 5 Random Leases
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomLeases(10)}>
                Add 10 Random Leases
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomLeases(20)}>
                Add 20 Random Leases
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddLeaseDialog onSuccess={fetchLeases} />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : leases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No leases found. Create your first lease to get started.
                </TableCell>
              </TableRow>
            ) : (
              leases.map((lease) => (
                <TableRow key={lease.lease_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{lease.unit.name}</div>
                      <div className="text-sm text-muted-foreground">{lease.unit.property.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>{lease.tenant.profiles.full_name}</TableCell>
                  <TableCell>{new Date(lease.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(lease.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>${lease.monthly_rent.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(lease.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingLease(lease)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {lease.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateLease(lease)}
                        >
                          Activate
                        </Button>
                      )}
                      {lease.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTerminate(lease.lease_id, lease.unit_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ViewLeaseDialog
        lease={viewingLease}
        open={!!viewingLease}
        onOpenChange={(open) => !open && setViewingLease(null)}
      />

      <TerminateLeaseDialog
        leaseId={terminatingLeaseId}
        unitId={terminatingUnitId}
        open={!!terminatingLeaseId}
        onOpenChange={(open) => {
          if (!open) {
            setTerminatingLeaseId(null);
            setTerminatingUnitId(null);
          }
        }}
        onSuccess={fetchLeases}
      />
    </div>
  );
}
