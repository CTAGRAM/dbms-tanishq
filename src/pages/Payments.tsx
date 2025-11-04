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
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PostPaymentDialog } from "@/components/payments/PostPaymentDialog";

interface Payment {
  payment_id: string;
  lease_id: string;
  amount: number;
  due_date: string;
  status: string;
  method: string | null;
  late_fee: number | null;
  paid_at: string | null;
  lease: {
    unit: {
      name: string;
    };
    tenant: {
      profiles: {
        full_name: string;
      };
    };
  };
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payment")
        .select(`
          *,
          lease (
            unit (name),
            tenant (profiles (full_name))
          )
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === "pending" && new Date(dueDate) < new Date()) {
      return <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>;
    }

    const colors: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      paid: "bg-accent text-accent-foreground",
      failed: "bg-destructive text-destructive-foreground",
      refunded: "bg-muted text-muted-foreground",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Track and manage rent payments</p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No payments found. Payments are automatically created when leases are confirmed.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.payment_id}>
                  <TableCell className="font-medium">{payment.lease.unit.name}</TableCell>
                  <TableCell>{payment.lease.tenant.profiles.full_name}</TableCell>
                  <TableCell>
                    ${payment.amount.toFixed(2)}
                    {payment.late_fee && payment.late_fee > 0 && (
                      <span className="text-xs text-destructive ml-1">
                        (+${payment.late_fee.toFixed(2)} late)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(payment.status, payment.due_date)}</TableCell>
                  <TableCell className="capitalize">{payment.method || "-"}</TableCell>
                  <TableCell>
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PostPaymentDialog
        payment={selectedPayment}
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
        onSuccess={fetchPayments}
      />
    </div>
  );
}
