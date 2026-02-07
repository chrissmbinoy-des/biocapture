import { Home, Camera, Award, Leaf, Cat, Bug, Bird, Fish, Microscope, ChevronDown, Target, LogOut, Trophy, Flame, ShoppingBag, User, Users, Bot } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainItems = [
  { title: "Camera", url: "/", icon: Camera },
  { title: "My Profile", url: "/profile", icon: User },
  { title: "Discovery Feed", url: "/feed", icon: Users },
];

const kingdoms = [
  { title: "Plants", url: "/plants", icon: Leaf, key: "plant" },
  { title: "Mammals", url: "/mammals", icon: Cat, key: "mammal" },
  { title: "Insects", url: "/insects", icon: Bug, key: "insect" },
  { title: "Birds", url: "/birds", icon: Bird, key: "bird" },
  { title: "Reptiles", url: "/reptiles", icon: CrocodileIcon, key: "reptile" },
  { title: "Fish", url: "/fish", icon: Fish, key: "fish" },
  { title: "Amphibians", url: "/amphibians", icon: FrogIcon, key: "amphibian" },
  { title: "Other Organisms", url: "/other-organisms", icon: Microscope, key: "other" },
];

const bottomItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Daily Challenges", url: "/daily-challenges", icon: Target },
  { title: "Badges", url: "/badges", icon: Award },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Login Streak", url: "/login-streak", icon: Flame },
  { title: "Coin Shop", url: "/coin-shop", icon: ShoppingBag },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const kingdomPaths = kingdoms.map(k => k.url);
  const isObservationsActive = kingdomPaths.includes(currentPath);
  const isCollapsed = state === "collapsed";

  const handleNavClick = () => {
    // Collapse sidebar on mobile when clicking a nav item
    setOpenMobile(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpenMobile(false);
    navigate("/auth");
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Camera */}
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Observations with Kingdoms */}
              <Collapsible defaultOpen={isObservationsActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-muted/50">
                      <Home className="h-4 w-4" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">Observations</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!isCollapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {/* Kingdom sublists */}
                        {kingdoms.map((kingdom) => (
                          <SidebarMenuSubItem key={kingdom.key}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={kingdom.url}
                                className="hover:bg-muted/50"
                                activeClassName="bg-muted text-primary font-medium"
                                onClick={handleNavClick}
                              >
                                <kingdom.icon className="h-3 w-3" />
                                <span>{kingdom.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {/* Other navigation items */}
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Logout */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {!isCollapsed && <span>Logout</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
