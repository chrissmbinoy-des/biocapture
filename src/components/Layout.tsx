import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CoinDisplay } from "@/components/CoinDisplay";
import { FloatingCameraButton } from "@/components/FloatingCameraButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="h-[100dvh] flex w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-50 shrink-0">
            <div className="flex items-center">
              <SidebarTrigger className="mr-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-semibold">Specassist</h1>
            </div>
            <CoinDisplay />
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
          <FloatingCameraButton />
        </div>
      </div>
    </SidebarProvider>
  );
}
