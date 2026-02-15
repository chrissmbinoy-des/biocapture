import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CoinDisplay } from "@/components/CoinDisplay";
import { FloatingCameraButton } from "@/components/FloatingCameraButton";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background sticky top-0 z-50">
            <div className="flex items-center">
              <SidebarTrigger className="mr-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-semibold">Specassist</h1>
            </div>
            <CoinDisplay />
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
          <FloatingCameraButton />
        </div>
      </div>
    </SidebarProvider>
  );
}
