import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardUser {
  id: string;
  username: string;
  level: number;
  total_xp: number;
  position: number;
}

interface RelativeLeaderboardProps {
  isMobile: boolean;
}

export function RelativeLeaderboard({ isMobile }: RelativeLeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUsername = 'Jane Doe'; // Same as Profile page

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .order('level', { ascending: false })
          .order('total_xp', { ascending: false })
          .limit(100);

        if (error) throw error;

        if (data) {
          // Add current user from localStorage if not in database
          const savedProgress = localStorage.getItem('userProgress');
          const currentUser = savedProgress ? JSON.parse(savedProgress) : { level: 1, totalXP: 0 };
          
          const currentUserData: LeaderboardUser = {
            id: 'current-user',
            username: currentUsername,
            level: currentUser.level,
            total_xp: currentUser.totalXP,
            position: 0
          };

          // Check if current user already exists in data
          const userExists = data.some(user => user.username === currentUsername);
          
          // Combine data
          const combined = userExists ? data : [...data, currentUserData];
          
          // Sort by level first, then by total_xp
          const sorted = combined.sort((a, b) => {
            if (b.level !== a.level) {
              return b.level - a.level;
            }
            return b.total_xp - a.total_xp;
          });
          
          // Find current user's position
          const userIndex = sorted.findIndex(u => u.username === currentUsername);
          
          const rankedUsers: LeaderboardUser[] = [];
          
          if (userIndex !== -1) {
            // User above (if exists)
            if (userIndex > 0) {
              rankedUsers.push({
                ...sorted[userIndex - 1],
                position: userIndex
              });
            }
            
            // Current user
            rankedUsers.push({
              ...sorted[userIndex],
              position: userIndex + 1
            });
            
            // User below (if exists)
            if (userIndex < sorted.length - 1) {
              rankedUsers.push({
                ...sorted[userIndex + 1],
                position: userIndex + 2
              });
            }
          } else {
            // Fallback: show top 3 users if current user not found
            for (let i = 0; i < Math.min(3, sorted.length); i++) {
              rankedUsers.push({
                ...sorted[i],
                position: i + 1
              });
            }
          }
          
          setUsers(rankedUsers);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20 shadow-xl">
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading rankings...</p>
        </div>
      </Card>
    );
  }

  const currentUserIndex = users.findIndex(u => {
    const savedProgress = localStorage.getItem('userProgress');
    const currentUsername = savedProgress ? JSON.parse(savedProgress).username || 'You' : 'You';
    return u.username === currentUsername;
  });

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20 shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Your Rank</h2>
            <p className="text-muted-foreground font-medium">Compete with others!</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
        </div>

        {/* Vertical Ranking */}
        <div className="relative flex justify-center">
          <div className="flex flex-col items-center gap-4">
            {users.map((user, index) => {
              const isMe = user.username === currentUsername;
              const xpToNextRank = index > 0 ? users[index - 1].total_xp - user.total_xp + 1 : null;
              
              return (
                <div key={user.id} className="relative">
                  {/* Connection Line between users */}
                  {index < users.length - 1 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-border" />
                  )}
                  
                  <div className="flex items-center gap-4">
                    {/* Position indicator on left */}
                    <div className="flex items-center gap-1 w-16 justify-end">
                      {index === 0 && <ChevronUp className="h-4 w-4 text-primary" />}
                      <p className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>
                        #{user.position}
                      </p>
                      {index === users.length - 1 && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    
                    {/* Avatar */}
                    <Avatar className={`h-16 w-16 ${isMe ? 'ring-4 ring-primary shadow-xl scale-110' : 'ring-2 ring-border'} transition-all`}>
                      <AvatarFallback className={isMe ? 'bg-primary text-primary-foreground text-lg font-bold' : 'bg-muted'}>
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Username and level on right */}
                    <div className="w-32">
                      <p className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-foreground'}`}>
                        {isMe ? 'You' : user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">Level {user.level}</p>
                      <p className="text-xs text-muted-foreground">{user.total_xp.toLocaleString()} XP</p>
                      {isMe && xpToNextRank && (
                        <p className="text-xs text-primary font-semibold mt-1">
                          +{xpToNextRank.toLocaleString()} to rank up
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
