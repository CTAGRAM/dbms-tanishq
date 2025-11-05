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
import { toast } from "@/hooks/use-toast";

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
      console.log('🔍 Executing global search for:', query);
      
      // Use the powerful SQL search function
      const { data, error } = await supabase.rpc('global_search', {
        search_query: query,
        search_limit: 20
      });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: error.message,
          variant: "destructive",
        });
        setResults([]);
        setLoading(false);
        return;
      }

      console.log('✅ Search completed. Results found:', (data as any[])?.length || 0);
      console.log('Search results:', data);

      const resultsArray = (data as any[]) || [];
      const searchResults: SearchResult[] = resultsArray.map((item: any) => ({
        type: item.result_type as SearchResult['type'],
        id: item.result_id,
        title: item.title,
        subtitle: item.subtitle,
        route: item.route,
      }));

      console.log('Mapped search results:', searchResults);
      setResults(searchResults);
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search",
        variant: "destructive",
      });
      setResults([]);
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
          ) : results.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <CommandGroup heading={`${results.length} Result${results.length !== 1 ? 's' : ''}`}>
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  {getIcon(result.type)}
                  <div className="ml-2 flex-1">
                    <div className="text-sm font-medium">{result.title}</div>
                    <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
