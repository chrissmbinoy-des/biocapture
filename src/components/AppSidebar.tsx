import { Home, Camera, MapPin, Award, Sparkles, Leaf, Cat, Bug, Bird, Fish, Microscope, ChevronDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";

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
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Badges", url: "/badges", icon: Award },
  { title: "Easter Eggs", url: "/easter-eggs", icon: Sparkles },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const kingdomPaths = kingdoms.map(k => k.url);
  const isObservationsActive = kingdomPaths.includes(currentPath);
  const isCollapsed = state === "collapsed";

  const handleNavClick = () => {
    // Collapse sidebar on mobile when clicking a nav item
    setOpenMobile(false);
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
