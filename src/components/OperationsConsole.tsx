import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ChevronDown, ChevronRight, Trash2, Filter, Terminal } from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: number;
  actor: string | null;
  txid: number | null;
  correlation_id: string | null;
  scope: string;
  op: string;
  object_type: string;
  object_id: string | null;
  sql_statement: string | null;
  params: any;
  rows_affected: number | null;
  duration_ms: number | null;
  status: string;
  error: string | null;
  created_at: string;
}

interface OperationsConsoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OperationsConsole = ({ open, onOpenChange }: OperationsConsoleProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Subscribe to real-time audit log updates
    const channel = supabase
      .channel("audit-logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_log",
        },
        (payload) => {
          setLogs((prev) => [payload.new as AuditLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    // Initial fetch
    fetchLogs();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching audit logs:", error);
    } else if (data) {
      setLogs(data);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copySQL = (sql: string | null) => {
    if (sql) {
      navigator.clipboard.writeText(sql);
      toast.success("SQL copied to clipboard");
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success("Console cleared");
  };

  const getOperationBadge = (op: string, status: string) => {
    const colors: Record<string, string> = {
      INSERT: "bg-accent text-accent-foreground",
      UPDATE: "bg-info text-info-foreground",
      DELETE: "bg-destructive text-destructive-foreground",
      BEGIN: "bg-muted text-muted-foreground",
      COMMIT: "bg-accent text-accent-foreground",
      ROLLBACK: "bg-destructive text-destructive-foreground",
    };

    const color = status === "error" ? "bg-destructive text-destructive-foreground" : colors[op] || "bg-secondary";

    return (
      <Badge className={`${color} text-xs font-mono`}>
        {op}
      </Badge>
    );
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    if (filter === "writes") return ["INSERT", "UPDATE", "DELETE"].includes(log.op);
    if (filter === "errors") return log.status === "error";
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] bg-console-bg border-l border-console-border p-0 sm:max-w-[600px]">
        <SheetHeader className="border-b border-console-border px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-console-text">Operations Console</SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter(filter === "all" ? "writes" : filter === "writes" ? "errors" : "all")}
                className="text-console-text"
              >
                <Filter className="h-4 w-4 mr-2" />
                {filter === "all" ? "All" : filter === "writes" ? "Writes" : "Errors"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="text-console-text"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-console-text/60">
                <Terminal className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-sm">No operations yet</p>
                <p className="text-xs mt-1">Database operations will appear here in real-time</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card
                  key={log.id}
                  className="bg-card/50 border-console-border hover:border-primary/50 transition-colors"
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => toggleExpanded(log.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {expandedLogs.has(log.id) ? (
                          <ChevronDown className="h-4 w-4 text-console-text" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-console-text" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getOperationBadge(log.op, log.status)}
                          <span className="text-xs font-mono text-console-text/80">
                            {log.object_type}
                          </span>
                          {log.correlation_id && (
                            <span className="text-xs font-mono text-console-text/40">
                              #{log.correlation_id.slice(0, 8)}
                            </span>
                          )}
                          <span className="text-xs text-console-text/40 ml-auto">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-console-text/60">
                          {log.rows_affected !== null && (
                            <span>{log.rows_affected} row(s)</span>
                          )}
                          {log.duration_ms !== null && (
                            <span>{log.duration_ms}ms</span>
                          )}
                          {log.status === "error" && log.error && (
                            <span className="text-destructive">{log.error}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedLogs.has(log.id) && (
                      <div className="mt-3 pt-3 border-t border-console-border space-y-2">
                        {log.sql_statement && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-console-text">SQL Statement</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copySQL(log.sql_statement);
                                }}
                                className="h-6 px-2 text-console-text"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <pre className="text-xs bg-console-bg/50 p-2 rounded font-mono text-console-text overflow-x-auto">
                              {log.sql_statement}
                            </pre>
                          </div>
                        )}
                        {log.params && (
                          <div>
                            <span className="text-xs font-medium text-console-text block mb-1">Parameters</span>
                            <pre className="text-xs bg-console-bg/50 p-2 rounded font-mono text-console-text overflow-x-auto">
                              {JSON.stringify(log.params, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
