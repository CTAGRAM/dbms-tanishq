import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateRandomTenant } from "@/lib/seedData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTenantDialog } from "@/components/tenants/AddTenantDialog";
import { EditTenantDialog } from "@/components/tenants/EditTenantDialog";
import { TenantCard } from "@/components/tenants/TenantCard";

interface Tenant {
  tenant_id: string;
  profile_id: string;
  occupation: string | null;
  annual_income: number | null;
  credit_score: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant")
        .select(`
          *,
          profiles (full_name, email, phone, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomTenants = async (count: number) => {
    try {
      // Get existing profiles that are not already tenants
      const { data: existingTenants } = await supabase
        .from("tenant")
        .select("profile_id");
      
      const existingTenantProfileIds = new Set(
        existingTenants?.map(t => t.profile_id) || []
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id");
      
      const availableProfiles = profiles?.filter(
        p => !existingTenantProfileIds.has(p.id)
      ) || [];

      if (availableProfiles.length === 0) {
        toast.error("No available profiles to convert to tenants. Please add users first.");
        return;
      }

      const actualCount = Math.min(count, availableProfiles.length);
      const selectedProfiles = availableProfiles.slice(0, actualCount);
      
      const tenantsData = selectedProfiles.map(() => generateRandomTenant());
      
      // Create tenant records for existing profiles
      for (let i = 0; i < selectedProfiles.length; i++) {
        const tenantData = tenantsData[i];
        const profile = selectedProfiles[i];

        const { error: tenantError } = await supabase.from("tenant").insert({
          profile_id: profile.id,
          occupation: tenantData.occupation,
          annual_income: tenantData.annual_income,
          credit_score: tenantData.credit_score,
          emergency_contact_name: tenantData.emergency_contact_name,
          emergency_contact_phone: tenantData.emergency_contact_phone
        });

        if (tenantError) {
          console.error("Error creating tenant:", tenantError);
        }
      }
      
      toast.success(`Generated ${actualCount} random tenants from existing profiles`);
      fetchTenants();
    } catch (error) {
      console.error("Error generating tenants:", error);
      toast.error("Failed to generate tenants");
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">Manage tenant information</p>
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
              <DropdownMenuItem onClick={() => generateRandomTenants(5)}>
                Add 5 Random Tenants
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomTenants(10)}>
                Add 10 Random Tenants
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomTenants(20)}>
                Add 20 Random Tenants
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddTenantDialog onSuccess={fetchTenants} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          No tenants found. Add your first tenant to get started.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {tenants.map((tenant) => (
            <TenantCard
              key={tenant.tenant_id}
              tenant={tenant}
              onEdit={() => handleEdit(tenant)}
            />
          ))}
        </div>
      )}

      <EditTenantDialog
        tenant={editingTenant}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchTenants}
      />
    </div>
  );
}
