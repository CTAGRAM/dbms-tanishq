import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutGrid, Table as TableIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateRandomProperty } from "@/lib/seedData";
import { toast } from "sonner";
import { AddPropertyDialog } from "@/components/properties/AddPropertyDialog";
import { EditPropertyDialog } from "@/components/properties/EditPropertyDialog";
import { DeletePropertyDialog } from "@/components/properties/DeletePropertyDialog";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [deletePropertyAddress, setDeletePropertyAddress] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage your real estate portfolio</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "table")}>
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <TableIcon className="h-4 w-4" />
                Table
              </TabsTrigger>
            </TabsList>
          </Tabs>
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

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-lg" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          No properties found. Add your first property to get started.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {properties.map((property) => (
            <PropertyCard
              key={property.property_id}
              property={property}
              onEdit={() => setEditProperty(property)}
              onDelete={() => {
                setDeletePropertyId(property.property_id);
                setDeletePropertyAddress(property.address);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          {/* Keep existing table view for backwards compatibility */}
          <p className="p-4 text-sm text-muted-foreground">Table view coming soon. Using grid view for now.</p>
        </div>
      )}

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
