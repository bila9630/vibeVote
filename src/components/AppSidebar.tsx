import { Home, BarChart3, Gift, User, Trophy, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { loadProgress, getXPForLevel, UserProgress } from "@/lib/xpSystem";

const navItems = [
  { title: "Homepage", url: "/", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Rewards Shop", url: "/rewards", icon: Gift },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open, setOpenMobile, isMobile } = useSidebar();
  const [userProgress, setUserProgress] = useState<UserProgress>(loadProgress());

  useEffect(() => {
    // Load progress initially
    setUserProgress(loadProgress());

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProgress') {
        setUserProgress(loadProgress());
      }
    };

    // Listen for visibility changes to reload progress
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setUserProgress(loadProgress());
      }
    };

    // Listen for custom XP update events
    const handleXPUpdate = () => {
      setUserProgress(loadProgress());
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('xpUpdated', handleXPUpdate);

    // Poll every 2 seconds as fallback
    const interval = setInterval(() => {
      setUserProgress(loadProgress());
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('xpUpdated', handleXPUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleNavClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const xpForNextLevel = getXPForLevel(userProgress.level);
  const xpProgress = (userProgress.currentXP / xpForNextLevel) * 100;

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
                  <span className="text-muted-foreground">Level {userProgress.level}</span>
                  <span className="font-medium">{userProgress.currentXP} / {xpForNextLevel} XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" 
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
