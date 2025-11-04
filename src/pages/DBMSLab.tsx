import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database } from "lucide-react";
import { UnitOne } from "@/components/dbms-lab/UnitOne";
import { UnitTwo } from "@/components/dbms-lab/UnitTwo";
import { UnitThree } from "@/components/dbms-lab/UnitThree";
import { UnitFour } from "@/components/dbms-lab/UnitFour";
import { UnitFive } from "@/components/dbms-lab/UnitFive";
import { AuditReport } from "@/components/dbms-lab/AuditReport";

export default function DBMSLab() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DBMS Lab</h1>
          <p className="text-muted-foreground mt-1">
            Interactive demonstrations of database concepts (Units I-V)
          </p>
        </div>
      </div>

      <Tabs defaultValue="unit1" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="unit1">Unit I</TabsTrigger>
          <TabsTrigger value="unit2">Unit II</TabsTrigger>
          <TabsTrigger value="unit3">Unit III</TabsTrigger>
          <TabsTrigger value="unit4">Unit IV</TabsTrigger>
          <TabsTrigger value="unit5">Unit V</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="unit1" className="space-y-4">
          <UnitOne />
        </TabsContent>

        <TabsContent value="unit2" className="space-y-4">
          <UnitTwo />
        </TabsContent>

        <TabsContent value="unit3" className="space-y-4">
          <UnitThree />
        </TabsContent>

        <TabsContent value="unit4" className="space-y-4">
          <UnitFour />
        </TabsContent>

        <TabsContent value="unit5" className="space-y-4">
          <UnitFive />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
