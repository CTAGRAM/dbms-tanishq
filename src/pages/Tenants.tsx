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
import { Edit, Mail, Phone } from "lucide-react";
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
        <AddTenantDialog onSuccess={fetchTenants} />
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
