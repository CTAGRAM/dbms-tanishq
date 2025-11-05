import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🔍 Running data integrity check...");

    // Check for lease-unit status mismatches
    const { data: mismatches, error: mismatchError } = await supabaseClient
      .from("lease_unit_status_mismatches")
      .select("*");

    if (mismatchError) {
      throw mismatchError;
    }

    const issueCount = mismatches?.length || 0;
    console.log(`📊 Found ${issueCount} data integrity issues`);

    // Auto-fix if configured (optional)
    const autoFix = req.headers.get("x-auto-fix") === "true";
    
    if (autoFix && issueCount > 0) {
      console.log("🔧 Auto-fixing data integrity issues...");

      // Get all active leases
      const { data: activeLeases } = await supabaseClient
        .from("lease")
        .select("unit_id")
        .eq("status", "active");

      const activeUnitIds = activeLeases?.map((l) => l.unit_id) || [];

      // Update units with active leases to LEASED
      if (activeUnitIds.length > 0) {
        await supabaseClient
          .from("unit")
          .update({ status: "LEASED" })
          .in("unit_id", activeUnitIds);
      }

      // Get all units and set non-leased ones to AVAILABLE
      const { data: allUnits } = await supabaseClient
        .from("unit")
        .select("unit_id");

      const unitsToSetAvailable =
        allUnits
          ?.filter((u) => !activeUnitIds.includes(u.unit_id))
          .map((u) => u.unit_id) || [];

      if (unitsToSetAvailable.length > 0) {
        await supabaseClient
          .from("unit")
          .update({ status: "AVAILABLE" })
          .in("unit_id", unitsToSetAvailable);
      }

      console.log("✅ Auto-fix completed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        issuesFound: issueCount,
        autoFixed: autoFix,
        mismatches: mismatches || [],
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Data integrity check failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
