import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Home, BarChart3, Gift, Trees, User, MessageSquare } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  page: string;
  path: string;
  icon: React.ReactNode;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate();

  // All searchable content grouped by page
  const allContent: SearchResult[] = [
    // Homepage
    {
      id: "home",
      title: "Homepage",
      description: "Answer daily questions and earn XP",
      page: "Navigation",
      path: "/",
      icon: <Home className="mr-2 h-4 w-4" />,
    },
    {
      id: "questions",
      title: "Daily Questions",
      description: "View and answer today's questions",
      page: "Homepage",
      path: "/",
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
    },
    // Analytics
    {
      id: "analytics",
      title: "Analytics",
      description: "View insights and question analytics",
      page: "Navigation",
      path: "/analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
    },
    {
      id: "trending-topics",
      title: "Trending Topics",
      description: "See what topics are trending",
      page: "Analytics",
      path: "/analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
    },
    {
      id: "monthly-activity",
      title: "Monthly User Activity",
      description: "Track user engagement over time",
      page: "Analytics",
      path: "/analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
    },
    // Rewards
    {
      id: "rewards",
      title: "Rewards",
      description: "View your rewards and achievements",
      page: "Navigation",
      path: "/rewards",
      icon: <Gift className="mr-2 h-4 w-4" />,
    },
    {
      id: "achievements",
      title: "Achievements",
      description: "Track your progress and unlock badges",
      page: "Rewards",
      path: "/rewards",
      icon: <Gift className="mr-2 h-4 w-4" />,
    },
    // Trees
    {
      id: "trees",
      title: "Trees",
      description: "Plant trees with your XP contributions",
      page: "Navigation",
      path: "/trees",
      icon: <Trees className="mr-2 h-4 w-4" />,
    },
    {
      id: "environmental-impact",
      title: "Environmental Impact",
      description: "See your contribution to reforestation",
      page: "Trees",
      path: "/trees",
      icon: <Trees className="mr-2 h-4 w-4" />,
    },
    // Profile
    {
      id: "profile",
      title: "Profile",
      description: "Manage your account settings",
      page: "Navigation",
      path: "/profile",
      icon: <User className="mr-2 h-4 w-4" />,
    },
    {
      id: "leaderboard",
      title: "Leaderboard",
      description: "Compare your progress with others",
      page: "Profile",
      path: "/profile",
      icon: <User className="mr-2 h-4 w-4" />,
    },
    {
      id: "xp-level",
      title: "XP & Level",
      description: "View your current level and XP progress",
      page: "Profile",
      path: "/profile",
      icon: <User className="mr-2 h-4 w-4" />,
    },
  ];

  // Group results by page (cmdk handles filtering internally)
  const groupedResults = allContent.reduce((acc, item) => {
    if (!acc[item.page]) {
      acc[item.page] = [];
    }
    acc[item.page].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search questions, insights..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedResults).map(([page, results]) => (
          <CommandGroup key={page} heading={page}>
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={`${result.title} ${result.description || ""}`}
                onSelect={() => handleSelect(result.path)}
                className="cursor-pointer"
              >
                {result.icon}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="text-xs text-muted-foreground">
                      {result.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
