import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, Users, FileText, DollarSign, Wrench } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: "property" | "tenant" | "lease" | "payment" | "maintenance";
  id: string;
  title: string;
  subtitle: string;
  route: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${query}%`;
      
      const [properties, tenants, leases, payments, maintenance] = await Promise.all([
        supabase
          .from("property")
          .select("property_id, address, city, type")
          .or(`address.ilike.${searchTerm},city.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from("tenant")
          .select("tenant_id, profile_id, profiles(full_name, email)")
          .limit(5),
        supabase
          .from("lease")
          .select("lease_id, status, monthly_rent, unit(name)")
          .limit(5),
        supabase
          .from("payment")
          .select("payment_id, amount, status, due_date")
          .limit(5),
        supabase
          .from("maintenance_request")
          .select("request_id, description, status, category")
          .or(`description.ilike.${searchTerm}`)
          .limit(5),
      ]);

      const searchResults: SearchResult[] = [];

      properties.data?.forEach((p: any) => {
        searchResults.push({
          type: "property",
          id: p.property_id,
          title: p.address,
          subtitle: `${p.city} - ${p.type}`,
          route: "/properties",
        });
      });

      tenants.data?.forEach((t: any) => {
        searchResults.push({
          type: "tenant",
          id: t.tenant_id,
          title: t.profiles?.full_name || "Unknown",
          subtitle: t.profiles?.email || "",
          route: "/tenants",
        });
      });

      leases.data?.forEach((l: any) => {
        searchResults.push({
          type: "lease",
          id: l.lease_id,
          title: `Lease - ${l.unit?.name || "Unknown Unit"}`,
          subtitle: `${l.status} - $${l.monthly_rent}/mo`,
          route: "/leases",
        });
      });

      payments.data?.forEach((p: any) => {
        searchResults.push({
          type: "payment",
          id: p.payment_id,
          title: `Payment - $${p.amount}`,
          subtitle: `${p.status} - Due ${new Date(p.due_date).toLocaleDateString()}`,
          route: "/payments",
        });
      });

      maintenance.data?.forEach((m: any) => {
        searchResults.push({
          type: "maintenance",
          id: m.request_id,
          title: m.description.substring(0, 50) + "...",
          subtitle: `${m.category} - ${m.status}`,
          route: "/maintenance",
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "property": return <Building2 className="h-4 w-4" />;
      case "tenant": return <Users className="h-4 w-4" />;
      case "lease": return <FileText className="h-4 w-4" />;
      case "payment": return <DollarSign className="h-4 w-4" />;
      case "maintenance": return <Wrench className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.route);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search properties, tenants, leases..." 
          onValueChange={performSearch}
        />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              {results.length > 0 && (
                <CommandGroup heading="Results">
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      {getIcon(result.type)}
                      <div className="ml-2">
                        <div className="text-sm font-medium">{result.title}</div>
                        <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
