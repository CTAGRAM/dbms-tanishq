import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Fetch current user stats
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch aggregated data
    const [properties, units, leases, tenants, payments, maintenance] = await Promise.all([
      supabase.from("property").select("*", { count: "exact" }),
      supabase.from("unit").select("*, property(address)", { count: "exact" }),
      supabase.from("lease").select("*, tenant(profile_id), unit(name)", { count: "exact" }),
      supabase.from("tenant").select("*", { count: "exact" }),
      supabase.from("payment").select("*", { count: "exact" }),
      supabase.from("maintenance_request").select("*", { count: "exact" }),
    ]);

    const stats = {
      totalProperties: properties.count || 0,
      totalUnits: units.count || 0,
      availableUnits: units.data?.filter((u: any) => u.status === "AVAILABLE").length || 0,
      leasedUnits: units.data?.filter((u: any) => u.status === "LEASED").length || 0,
      totalLeases: leases.count || 0,
      activeLeases: leases.data?.filter((l: any) => l.status === "active").length || 0,
      draftLeases: leases.data?.filter((l: any) => l.status === "draft").length || 0,
      terminatedLeases: leases.data?.filter((l: any) => l.status === "terminated").length || 0,
      totalTenants: tenants.count || 0,
      totalPayments: payments.count || 0,
      pendingPayments: payments.data?.filter((p: any) => p.status === "pending").length || 0,
      paidPayments: payments.data?.filter((p: any) => p.status === "paid").length || 0,
      overduePayments: payments.data?.filter((p: any) => 
        p.status === "pending" && new Date(p.due_date) < new Date()
      ).length || 0,
      totalRevenue: payments.data?.filter((p: any) => p.status === "paid")
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0,
      maintenanceTotal: maintenance.count || 0,
      openMaintenance: maintenance.data?.filter((m: any) => m.status === "open").length || 0,
      inProgressMaintenance: maintenance.data?.filter((m: any) => m.status === "in_progress").length || 0,
      resolvedMaintenance: maintenance.data?.filter((m: any) => m.status === "resolved").length || 0,
    };

    // Build context for AI
    const context = `
You are a helpful real estate management assistant with access to the following current data:

PROPERTIES & UNITS:
- Total Properties: ${stats.totalProperties}
- Total Units: ${stats.totalUnits}
- Available Units: ${stats.availableUnits}
- Leased Units: ${stats.leasedUnits}
- Occupancy Rate: ${((stats.leasedUnits / stats.totalUnits) * 100).toFixed(1)}%

LEASES:
- Total Leases: ${stats.totalLeases}
- Active Leases: ${stats.activeLeases}
- Draft Leases: ${stats.draftLeases}
- Terminated Leases: ${stats.terminatedLeases}

TENANTS:
- Total Tenants: ${stats.totalTenants}

PAYMENTS:
- Total Payments: ${stats.totalPayments}
- Pending Payments: ${stats.pendingPayments}
- Paid Payments: ${stats.paidPayments}
- Overdue Payments: ${stats.overduePayments}
- Total Revenue: $${stats.totalRevenue.toLocaleString()}

MAINTENANCE:
- Total Requests: ${stats.maintenanceTotal}
- Open: ${stats.openMaintenance}
- In Progress: ${stats.inProgressMaintenance}
- Resolved: ${stats.resolvedMaintenance}

Answer the user's question based on this data. Be concise and helpful. Format numbers clearly.
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service requires payment. Please contact support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const error = await response.text();
      console.error('AI gateway error:', response.status, error);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in property-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
