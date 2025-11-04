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
import { Button } from "@/components/ui/button";
import { Edit, Mail, Phone, Sparkles } from "lucide-react";
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
  };
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
          profiles (full_name, email, phone)
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
      const tenantsData = Array.from({ length: count }, () => generateRandomTenant());
      
      // First create profiles, then create tenant records
      for (const tenantData of tenantsData) {
        // Create a user/profile first
        const { data: profile, error: profileError } = await supabase.auth.signUp({
          email: tenantData.email,
          password: crypto.randomUUID(),
          options: {
            data: {
              full_name: tenantData.full_name,
              phone: tenantData.phone
            }
          }
        });

        if (profileError || !profile.user) {
          console.error("Error creating profile:", profileError);
          continue;
        }

        // Create tenant record
        await supabase.from("tenant").insert({
          profile_id: profile.user.id,
          occupation: tenantData.occupation,
          annual_income: tenantData.annual_income,
          credit_score: tenantData.credit_score,
          emergency_contact_name: tenantData.emergency_contact_name,
          emergency_contact_phone: tenantData.emergency_contact_phone
        });
      }
      
      toast.success(`Generated ${count} random tenants`);
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No tenants found. Add your first tenant to get started.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.tenant_id}>
                  <TableCell className="font-medium">{tenant.profiles.full_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {tenant.profiles.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {tenant.profiles.phone || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>{tenant.occupation || "N/A"}</TableCell>
                  <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tenant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditTenantDialog
        tenant={editingTenant}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchTenants}
      />
    </div>
  );
}
