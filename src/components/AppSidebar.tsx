import { Home, BarChart3, Gift, User, Trophy, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Homepage", url: "/", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Rewards Shop", url: "/rewards", icon: Gift },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open, setOpenMobile, isMobile } = useSidebar();

  const handleNavClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border hidden md:flex" side="left">
      <SidebarContent>
        {/* Brand Header */}
        <div className="p-4 border-b border-border">
          <div className={`flex items-center ${open ? 'gap-2' : 'justify-center'}`}>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md flex-shrink-0">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            {open && (
              <div>
                <h2 className="font-bold text-lg">FeedbackQuest</h2>
                <p className="text-xs text-muted-foreground">Level up together</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* XP Display in Sidebar */}
        {open && (
          <div className="mt-auto p-4 border-t border-border">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Level 5</span>
                  <span className="font-medium">850 / 1000 XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary w-[85%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
