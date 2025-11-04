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
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateRandomProperty } from "@/lib/seedData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPropertyDialog } from "@/components/properties/AddPropertyDialog";
import { EditPropertyDialog } from "@/components/properties/EditPropertyDialog";
import { DeletePropertyDialog } from "@/components/properties/DeletePropertyDialog";

interface Property {
  property_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  type: string;
  status: string;
  created_at: string;
  description?: string;
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [deletePropertyAddress, setDeletePropertyAddress] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("property")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomProperties = async (count: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to generate properties");
        return;
      }

      const properties = Array.from({ length: count }, () => ({
        ...generateRandomProperty(),
        owner_id: user.id
      }));
      const { error } = await supabase.from("property").insert(properties);
      
      if (error) throw error;
      
      toast.success(`Generated ${count} random properties`);
      fetchProperties();
    } catch (error) {
      console.error("Error generating properties:", error);
      toast.error("Failed to generate properties");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-accent text-accent-foreground",
      inactive: "bg-muted text-muted-foreground",
      maintenance: "bg-warning text-warning-foreground",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage your real estate portfolio</p>
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
              <DropdownMenuItem onClick={() => generateRandomProperties(5)}>
                Add 5 Random Properties
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomProperties(10)}>
                Add 10 Random Properties
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomProperties(20)}>
                Add 20 Random Properties
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddPropertyDialog onSuccess={fetchProperties} />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No properties found. Add your first property to get started.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.property_id}>
                  <TableCell className="font-medium">{property.address}</TableCell>
                  <TableCell>{property.city}</TableCell>
                  <TableCell>{property.state}</TableCell>
                  <TableCell className="capitalize">{property.type}</TableCell>
                  <TableCell>{getStatusBadge(property.status)}</TableCell>
                  <TableCell>{new Date(property.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditProperty(property)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletePropertyId(property.property_id);
                          setDeletePropertyAddress(property.address);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditPropertyDialog
        property={editProperty}
        open={!!editProperty}
        onOpenChange={(open) => !open && setEditProperty(null)}
        onSuccess={fetchProperties}
      />

      <DeletePropertyDialog
        propertyId={deletePropertyId}
        propertyAddress={deletePropertyAddress}
        open={!!deletePropertyId}
        onOpenChange={(open) => !open && setDeletePropertyId(null)}
        onSuccess={fetchProperties}
      />
    </div>
  );
}
