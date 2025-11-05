import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, DollarSign, FileText, User, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Lease {
  lease_id: string;
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

interface ViewLeaseDialogProps {
  lease: Lease | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewLeaseDialog({ lease, open, onOpenChange }: ViewLeaseDialogProps) {
  const [unitStatus, setUnitStatus] = useState<string | null>(null);
  const [statusMismatch, setStatusMismatch] = useState(false);

  useEffect(() => {
    const checkUnitStatus = async () => {
      if (!lease) return;
      
      const { data } = await supabase
        .from("unit")
        .select("status")
        .eq("unit_id", lease.unit?.name)
        .single();

      if (data) {
        setUnitStatus(data.status);
        // Check for mismatch: active lease should have LEASED unit
        const hasMismatch = lease.status === "active" && data.status !== "LEASED";
        setStatusMismatch(hasMismatch);
      }
    };

    if (open && lease) {
      checkUnitStatus();
    }
  }, [lease, open]);

  if (!lease) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      case "ended":
        return "bg-gray-500";
      case "terminated":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lease Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {statusMismatch && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Status Mismatch Detected: This lease is active but the unit status is "{unitStatus}". 
                The unit should be marked as "LEASED".
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Property & Unit</p>
                  <p className="text-sm text-muted-foreground">
                    {lease.unit.name} - {lease.unit.property.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tenant</p>
                  <p className="text-sm text-muted-foreground">
                    {lease.tenant.profiles.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lease.tenant.profiles.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Lease Period</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lease.start_date).toLocaleDateString()} -{" "}
                    {new Date(lease.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Monthly Rent</p>
                  <p className="text-sm text-muted-foreground">
                    ${lease.monthly_rent.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Security Deposit</p>
                  <p className="text-sm text-muted-foreground">
                    ${lease.deposit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge className={getStatusColor(lease.status)}>
                    {lease.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {lease.payment && lease.payment.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment Schedule</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lease.payment.map((payment) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell>
                          {new Date(payment.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
