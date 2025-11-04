import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface TerminateLeaseDialogProps {
  leaseId: string | null;
  unitId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TerminateLeaseDialog({
  leaseId,
  unitId,
  open,
  onOpenChange,
  onSuccess,
}: TerminateLeaseDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleTerminate = async () => {
    if (!leaseId || !unitId) return;

    setLoading(true);
    try {
      // Update lease status to terminated
      const { error: leaseError } = await supabase
        .from("lease")
        .update({ status: "terminated" })
        .eq("lease_id", leaseId);

      if (leaseError) throw leaseError;

      // Update unit status back to available
      const { error: unitError } = await supabase
        .from("unit")
        .update({ status: "AVAILABLE" })
        .eq("unit_id", unitId);

      if (unitError) throw unitError;

      toast({
        title: "Success",
        description: "Lease terminated and unit is now available",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to terminate lease",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminate Lease?</AlertDialogTitle>
          <AlertDialogDescription>
            This will terminate the lease and make the unit available again. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTerminate} disabled={loading}>
            {loading ? "Terminating..." : "Terminate Lease"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
