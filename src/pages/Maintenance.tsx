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
import { Edit, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateRandomMaintenance } from "@/lib/seedData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AddMaintenanceDialog } from "@/components/maintenance/AddMaintenanceDialog";
import { UpdateStatusDialog } from "@/components/maintenance/UpdateStatusDialog";

interface MaintenanceRequest {
  request_id: string;
  unit_id: string;
  category: string;
  description: string;
  priority: number;
  status: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
  unit: {
    name: string;
    property: {
      address: string;
    };
  };
}

export default function Maintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [updatingRequestStatus, setUpdatingRequestStatus] = useState<string>("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_request")
        .select(`
          *,
          unit (name, property (address))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomRequests = async (count: number) => {
    try {
      // Get all units
      const { data: units, error: unitsError } = await supabase
        .from("unit")
        .select("unit_id");

      if (unitsError) throw unitsError;
      if (!units || units.length === 0) {
        toast.error("No units available. Please add properties with units first.");
        return;
      }

      const requests = Array.from({ length: count }, () => 
        generateRandomMaintenance(units[Math.floor(Math.random() * units.length)].unit_id)
      );
      
      const { error } = await supabase.from("maintenance_request").insert(requests);
      
      if (error) throw error;
      
      toast.success(`Generated ${count} random maintenance requests`);
      fetchRequests();
    } catch (error) {
      console.error("Error generating maintenance requests:", error);
      toast.error("Failed to generate maintenance requests");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-warning text-warning-foreground",
      assigned: "bg-primary text-primary-foreground",
      in_progress: "bg-accent text-accent-foreground",
      resolved: "bg-accent text-accent-foreground",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <Badge className={colors[status] || ""}>{status.replace("_", " ")}</Badge>;
  };

  const getPriorityBadge = (priority: number) => {
    const colors = ["", "bg-destructive", "bg-warning", "bg-primary", "bg-muted", "bg-muted"];
    const labels = ["", "Critical", "High", "Medium", "Low", "Very Low"];
    return <Badge className={colors[priority]}>{labels[priority]}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1">Manage maintenance requests and repairs</p>
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
              <DropdownMenuItem onClick={() => generateRandomRequests(5)}>
                Add 5 Random Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomRequests(10)}>
                Add 10 Random Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateRandomRequests(20)}>
                Add 20 Random Requests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddMaintenanceDialog onSuccess={fetchRequests} />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Est. Cost</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No maintenance requests found. Create your first request to get started.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.request_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{request.unit.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.unit.property.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{request.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.description}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.estimated_cost ? `$${request.estimated_cost.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setUpdatingRequestId(request.request_id);
                        setUpdatingRequestStatus(request.status);
                      }}
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

      <UpdateStatusDialog
        requestId={updatingRequestId}
        currentStatus={updatingRequestStatus}
        open={!!updatingRequestId}
        onOpenChange={(open) => !open && setUpdatingRequestId(null)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
