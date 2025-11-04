import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { OperationsConsole } from "@/components/OperationsConsole";
import { useState } from "react";

export const Layout = () => {
  const [consoleOpen, setConsoleOpen] = useState(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar onToggleConsole={() => setConsoleOpen(!consoleOpen)} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <OperationsConsole open={consoleOpen} onOpenChange={setConsoleOpen} />
      </div>
    </SidebarProvider>
  );
};
