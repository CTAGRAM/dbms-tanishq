import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  unit_id: z.string().min(1, "Please select a unit"),
  tenant_id: z.string().min(1, "Please select a tenant"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  deposit: z.string().min(0),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

type FormData = z.infer<typeof formSchema>;

interface AddLeaseDialogProps {
  onSuccess?: () => void;
}

export function AddLeaseDialog({ onSuccess }: AddLeaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      deposit: "0",
    },
  });

  useEffect(() => {
    if (open) {
      fetchUnitsAndTenants();
    }
  }, [open]);

  const fetchUnitsAndTenants = async () => {
    setAuthError(null);
    setDataError(null);
    
    try {
      // Step 1: Check authentication state
      const { data: { user }, error: authCheckError } = await supabase.auth.getUser();
      
      console.log("Auth check:", { user: user?.id, authCheckError });
      
      if (authCheckError || !user) {
        const errorMsg = "Please sign in to create leases";
        setAuthError(errorMsg);
        console.error("Authentication required:", authCheckError);
        toast({
          title: "Authentication Required",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      // Step 2: Fetch units and tenants
      const [{ data: unitsData, error: unitsError }, { data: tenantsData, error: tenantsError }] = await Promise.all([
        supabase
          .from("unit")
          .select("unit_id, name, property_id, rent_amount")
          .eq("status", "AVAILABLE"),
        supabase
          .from("tenant")
          .select("tenant_id, profiles(full_name)")
          .order("created_at", { ascending: false }),
      ]);

      // Step 3: Enhanced error logging
      if (unitsError) {
        console.error("Units error details:", {
          message: unitsError.message,
          code: unitsError.code,
          details: unitsError.details,
          hint: unitsError.hint,
          userId: user.id
        });
        
        // Check if it's an RLS issue
        if (unitsError.code === 'PGRST301' || unitsError.message.includes('row-level security')) {
          setDataError("You don't have permission to view available units. Please contact an administrator.");
        } else {
          setDataError(unitsError.message);
        }
        
        toast({
          title: "Error loading units",
          description: unitsError.message,
          variant: "destructive",
        });
      }

      if (tenantsError) {
        console.error("Tenants error details:", {
          message: tenantsError.message,
          code: tenantsError.code,
          details: tenantsError.details,
          hint: tenantsError.hint,
          userId: user.id
        });
        
        toast({
          title: "Error loading tenants", 
          description: tenantsError.message,
          variant: "destructive",
        });
      }

      // Step 4: Set data with debugging info
      console.log("Data fetched:", { 
        unitsCount: unitsData?.length || 0, 
        tenantsCount: tenantsData?.length || 0,
        hasUnitsError: !!unitsError,
        hasTenantsError: !!tenantsError
      });
      
      setUnits(unitsData || []);
      setTenants(tenantsData || []);

      // If no units but no error, it's genuinely empty
      if (!unitsError && (!unitsData || unitsData.length === 0)) {
        setDataError("No available units found. Please add properties with units first.");
      }
      
    } catch (error) {
      console.error("Unexpected error fetching data:", error);
      setDataError("An unexpected error occurred. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load units and tenants",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormData, confirm: boolean = false) => {
    const selectedUnit = units.find((u) => u.unit_id === data.unit_id);
    if (!selectedUnit) return;

    const depositAmount = data.deposit ? parseFloat(data.deposit) : selectedUnit.rent_amount;

    if (confirm) {
      setConfirming(true);
      try {
        const { data: result, error } = await supabase.rpc("sp_confirm_lease", {
          p_unit_id: data.unit_id,
          p_tenant_id: data.tenant_id,
          p_start_date: data.start_date,
          p_end_date: data.end_date,
          p_deposit: depositAmount,
        });

        if (error) throw error;

        const paymentsCreated = result && typeof result === 'object' && 'payments_created' in result ? result.payments_created : 0;
        
        toast({
          title: "Success",
          description: `Lease confirmed! ${paymentsCreated} payments created`,
        });

        form.reset();
        setOpen(false);
        onSuccess?.();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to confirm lease",
          variant: "destructive",
        });
      } finally {
        setConfirming(false);
      }
    } else {
      setLoading(true);
      try {
        const { error } = await supabase.from("lease").insert([
          {
            unit_id: data.unit_id,
            tenant_id: data.tenant_id,
            start_date: data.start_date,
            end_date: data.end_date,
            monthly_rent: selectedUnit.rent_amount,
            deposit: depositAmount,
            status: "draft",
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lease saved as draft",
        });

        form.reset();
        setOpen(false);
        onSuccess?.();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save draft",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Lease
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Lease</DialogTitle>
          <DialogDescription>
            Select unit and tenant, then choose to save as draft or confirm the lease.
          </DialogDescription>
        </DialogHeader>

        {authError ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-destructive font-medium">{authError}</p>
            <p className="text-muted-foreground text-sm">
              You need to be signed in to create leases
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  fetchUnitsAndTenants();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : dataError ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-destructive font-medium">{dataError}</p>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={fetchUnitsAndTenants}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : !units.length || !tenants.length ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              {!units.length 
                ? "No available units found. Please add properties with units first." 
                : "No tenants found. Please add tenants first."}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.unit_id} value={unit.unit_id}>
                            {unit.name} (${unit.rent_amount}/mo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                          {tenant.profiles?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount (optional, defaults to monthly rent)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading || confirming}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={form.handleSubmit((data) => onSubmit(data, false))}
                disabled={loading || confirming}
              >
                {loading ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                disabled={loading || confirming}
              >
                {confirming ? "Confirming..." : "Confirm Lease"}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
