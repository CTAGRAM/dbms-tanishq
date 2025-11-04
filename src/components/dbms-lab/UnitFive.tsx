import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Lock, AlertTriangle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UnitFive() {
  return (
    <div className="space-y-6">
      {/* Isolation Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Transaction Isolation Levels
          </CardTitle>
          <CardDescription>
            Understanding anomalies at different isolation levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-destructive">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">READ UNCOMMITTED</p>
                <Badge variant="destructive">Dirty Reads</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Allows reading uncommitted changes. Lowest isolation, highest performance.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-warning">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">READ COMMITTED (Postgres Default)</p>
                <Badge variant="outline">Non-repeatable Reads</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Only reads committed data. Prevents dirty reads but allows non-repeatable reads.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-info">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">REPEATABLE READ</p>
                <Badge variant="outline">Phantom Reads</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ensures repeated reads return same data. May still see phantom rows.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-accent">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">SERIALIZABLE</p>
                <Badge variant="default">No Anomalies</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Strictest isolation. Transactions execute as if serial. May cause more conflicts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Concurrency Anomalies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <p className="font-semibold text-sm mb-2">Dirty Read</p>
            <div className="space-y-1 text-xs font-mono">
              <p>T1: UPDATE payment SET amount=2000 WHERE payment_id='xyz';</p>
              <p>T2: SELECT amount FROM payment WHERE payment_id='xyz'; -- Reads 2000</p>
              <p>T1: ROLLBACK; -- T2 read uncommitted data!</p>
            </div>
          </div>

          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
            <p className="font-semibold text-sm mb-2">Non-repeatable Read</p>
            <div className="space-y-1 text-xs font-mono">
              <p>T1: SELECT amount FROM payment WHERE payment_id='xyz'; -- Reads 1000</p>
              <p>T2: UPDATE payment SET amount=2000 WHERE payment_id='xyz'; COMMIT;</p>
              <p>T1: SELECT amount FROM payment WHERE payment_id='xyz'; -- Reads 2000 (different!)</p>
            </div>
          </div>

          <div className="bg-info/10 p-4 rounded-lg border border-info/20">
            <p className="font-semibold text-sm mb-2">Phantom Read</p>
            <div className="space-y-1 text-xs font-mono">
              <p>T1: SELECT COUNT(*) FROM payment WHERE status='pending'; -- Returns 5</p>
              <p>T2: INSERT INTO payment (...) VALUES (..., 'pending'); COMMIT;</p>
              <p>T1: SELECT COUNT(*) FROM payment WHERE status='pending'; -- Returns 6 (phantom!)</p>
            </div>
          </div>

          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <p className="font-semibold text-sm mb-2">Lost Update</p>
            <div className="space-y-1 text-xs font-mono">
              <p>T1: SELECT amount FROM payment WHERE payment_id='xyz'; -- Reads 1000</p>
              <p>T2: SELECT amount FROM payment WHERE payment_id='xyz'; -- Reads 1000</p>
              <p>T1: UPDATE payment SET amount=1100 WHERE payment_id='xyz'; COMMIT;</p>
              <p>T2: UPDATE payment SET amount=1200 WHERE payment_id='xyz'; COMMIT; -- T1's update lost!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concurrency Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Concurrency Control Protocols
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">Two-Phase Locking (2PL)</p>
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground">Growing Phase: Acquire locks</p>
                <p className="text-muted-foreground">Shrinking Phase: Release locks</p>
                <Badge variant="outline" className="mt-2">Postgres uses this</Badge>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">Timestamp Ordering</p>
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground">Assign timestamp to each txn</p>
                <p className="text-muted-foreground">Older txns have priority</p>
                <Badge variant="outline" className="mt-2">Lock-free</Badge>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">Optimistic (Validation)</p>
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground">Read/Compute freely</p>
                <p className="text-muted-foreground">Validate before commit</p>
                <Badge variant="outline" className="mt-2">Low conflict</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deadlock */}
      <Card>
        <CardHeader>
          <CardTitle>Deadlock Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <p className="font-semibold text-sm mb-3">Example Deadlock Scenario:</p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1 text-xs font-mono">
                <p className="font-semibold">Transaction 1:</p>
                <p>LOCK payment_id='A';</p>
                <p className="text-warning">-- waiting for lease_id='X' --</p>
                <p>UPDATE lease SET ... WHERE lease_id='X';</p>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <p className="font-semibold">Transaction 2:</p>
                <p>LOCK lease_id='X';</p>
                <p className="text-warning">-- waiting for payment_id='A' --</p>
                <p>UPDATE payment SET ... WHERE payment_id='A';</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-background rounded text-xs">
              <p className="font-semibold">Postgres Deadlock Detector:</p>
              <p className="text-muted-foreground">
                Periodically checks wait-for graph. Aborts one transaction to break cycle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Serializability */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Serializability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold text-sm mb-2">Conflict Serializability</p>
            <p className="text-xs text-muted-foreground">
              Build precedence graph. If acyclic → conflict serializable
            </p>
            <Badge variant="default" className="mt-2">Most common check</Badge>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold text-sm mb-2">View Serializability</p>
            <p className="text-xs text-muted-foreground">
              Final database state matches some serial schedule. Harder to verify (NP-complete).
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold text-sm mb-2">Recoverability</p>
            <div className="space-y-1 text-xs">
              <p><strong>Recoverable:</strong> T2 commits only after T1 (if T2 reads from T1)</p>
              <p><strong>Cascadeless:</strong> Only read committed data</p>
              <p><strong>Strict:</strong> Don't read/write uncommitted changes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Query Processing & EXPLAIN ANALYZE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-xs">
            <p className="text-primary">EXPLAIN ANALYZE</p>
            <p>SELECT p.*, u.*, l.* FROM property p</p>
            <p>JOIN unit u ON p.property_id = u.property_id</p>
            <p>JOIN lease l ON u.unit_id = l.unit_id</p>
            <p>WHERE l.status = 'active';</p>
            
            <div className="mt-3 p-2 bg-background rounded text-muted-foreground">
              <p>Shows: Query plan, costs, actual time, rows, indexes used, join methods</p>
              <p className="mt-1">Use indexes on frequently filtered columns to speed up queries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">Write-Ahead Logging (WAL)</p>
              <p className="text-xs text-muted-foreground">
                Log changes before applying to disk. On crash: redo committed, undo uncommitted.
              </p>
              <Badge variant="default" className="mt-2">Postgres uses WAL</Badge>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">Shadow Paging</p>
              <p className="text-xs text-muted-foreground">
                Copy-on-write pages. On commit: switch page table. On crash: keep old pages.
              </p>
              <Badge variant="outline" className="mt-2">Simpler but slower</Badge>
            </div>
          </div>

          <div className="mt-4 p-4 bg-info/10 rounded-lg border border-info/20">
            <p className="font-semibold text-sm mb-1">Checkpoints</p>
            <p className="text-xs text-muted-foreground">
              Periodically flush dirty pages to disk and record checkpoint in WAL. Reduces recovery time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
