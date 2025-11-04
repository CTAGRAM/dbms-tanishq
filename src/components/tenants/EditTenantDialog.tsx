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
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  annual_income: z.string().optional(),
  credit_score: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Tenant {
  tenant_id: string;
  profile_id: string;
  occupation: string | null;
  annual_income: number | null;
  credit_score: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface EditTenantDialogProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTenantDialog({
  tenant,
  open,
  onOpenChange,
  onSuccess,
}: EditTenantDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      occupation: "",
      annual_income: "",
      credit_score: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        full_name: tenant.profiles.full_name,
        email: tenant.profiles.email,
        phone: tenant.profiles.phone || "",
        occupation: tenant.occupation || "",
        annual_income: tenant.annual_income?.toString() || "",
        credit_score: tenant.credit_score?.toString() || "",
        emergency_contact_name: tenant.emergency_contact_name || "",
        emergency_contact_phone: tenant.emergency_contact_phone || "",
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: FormData) => {
    if (!tenant) return;

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
        })
        .eq("id", tenant.profile_id);

      if (profileError) throw profileError;

      // Update tenant
      const { error: tenantError } = await supabase
        .from("tenant")
        .update({
          occupation: data.occupation || null,
          annual_income: data.annual_income ? parseFloat(data.annual_income) : null,
          credit_score: data.credit_score ? parseInt(data.credit_score) : null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
        })
        .eq("tenant_id", tenant.tenant_id);

      if (tenantError) throw tenantError;

      toast({
        title: "Success",
        description: "Tenant updated successfully",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tenant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update tenant profile and financial information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="annual_income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Income</FormLabel>
                    <FormControl>
                      <Input type="number" step="1000" placeholder="75000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credit_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Score</FormLabel>
                    <FormControl>
                      <Input type="number" min="300" max="850" placeholder="720" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 987-6543" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
