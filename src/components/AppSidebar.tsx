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
  { title: "Plants", url: "/species?kingdom=plant", icon: Leaf, key: "plant" },
  { title: "Mammals", url: "/species?kingdom=mammal", icon: Cat, key: "mammal" },
  { title: "Insects", url: "/species?kingdom=insect", icon: Bug, key: "insect" },
  { title: "Birds", url: "/species?kingdom=bird", icon: Bird, key: "bird" },
  { title: "Reptiles", url: "/species?kingdom=reptile", icon: CrocodileIcon, key: "reptile" },
  { title: "Fish", url: "/species?kingdom=fish", icon: Fish, key: "fish" },
  { title: "Amphibians", url: "/species?kingdom=amphibian", icon: FrogIcon, key: "amphibian" },
  { title: "Other Organisms", url: "/species?kingdom=other", icon: Microscope, key: "other" },
];

const bottomItems = [
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Badges", url: "/badges", icon: Award },
  { title: "Easter Eggs", url: "/easter-eggs", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentKingdom = searchParams.get("kingdom");

  const isSpeciesActive = currentPath === "/species";
  const isCollapsed = state === "collapsed";

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
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Species with Kingdoms */}
              <Collapsible defaultOpen={isSpeciesActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-muted/50">
                      <Home className="h-4 w-4" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">Species</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!isCollapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {/* All Species */}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <NavLink
                              to="/species"
                              end
                              className="hover:bg-muted/50"
                              activeClassName={!currentKingdom ? "bg-muted text-primary font-medium" : ""}
                            >
                              <Home className="h-3 w-3" />
                              <span>All Species</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {/* Kingdom sublists */}
                        {kingdoms.map((kingdom) => (
                          <SidebarMenuSubItem key={kingdom.key}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={kingdom.url}
                                className="hover:bg-muted/50"
                                activeClassName={currentKingdom === kingdom.key ? "bg-muted text-primary font-medium" : ""}
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
