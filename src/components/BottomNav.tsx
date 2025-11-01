import { Home, BarChart3, Gift, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Rewards", url: "/rewards", icon: Gift },
  { title: "Profile", url: "/profile", icon: User },
];

export function BottomNav() {
  const location = useLocation();

  const handleNavClick = (url: string, e: React.MouseEvent) => {
    // If clicking on the current route, force a refresh
    if (location.pathname === url) {
      e.preventDefault();
      // Force a window reload to fully refresh the page
      window.location.reload();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-sm">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            onClick={(e) => handleNavClick(item.url, e)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
