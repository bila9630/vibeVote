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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Get current user's progress from localStorage
        const savedProgress = localStorage.getItem('userProgress');
        const currentUsername = savedProgress ? JSON.parse(savedProgress).username || 'You' : 'You';
        
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .order('level', { ascending: false })
          .order('total_xp', { ascending: false })
          .limit(100);

        if (error) throw error;

        if (data) {
          // Find current user's position
          const userIndex = data.findIndex(u => u.username === currentUsername);
          
          if (userIndex !== -1) {
            // Get users around current user
            const rankedUsers: LeaderboardUser[] = [];
            
            // User above (if exists)
            if (userIndex > 0) {
              rankedUsers.push({
                ...data[userIndex - 1],
                position: userIndex
              });
            }
            
            // Current user
            rankedUsers.push({
              ...data[userIndex],
              position: userIndex + 1
            });
            
            // User below (if exists)
            if (userIndex < data.length - 1) {
              rankedUsers.push({
                ...data[userIndex + 1],
                position: userIndex + 2
              });
            }
            
            setUsers(rankedUsers);
          }
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

        {/* Ranking Timeline */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-[calc(50%+12px)] left-0 right-0 h-1 bg-border" 
               style={{ left: '10%', right: '10%', width: '80%' }} />

          {/* Users positioned like streak */}
          <div className="flex items-center justify-between relative">
            {users.map((user, index) => {
              const isCurrentUser = index === currentUserIndex;
              const savedProgress = localStorage.getItem('userProgress');
              const currentUsername = savedProgress ? JSON.parse(savedProgress).username || 'You' : 'You';
              const isMe = user.username === currentUsername;
              
              return (
                <div key={user.id} className="flex flex-col items-center gap-3">
                  {/* Position indicator */}
                  <div className="flex items-center gap-1">
                    {index === 0 && <ChevronUp className="h-4 w-4 text-primary" />}
                    <p className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>
                      #{user.position}
                    </p>
                    {index === users.length - 1 && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className={`h-14 w-14 ${isMe ? 'ring-4 ring-primary shadow-lg' : 'ring-2 ring-border'} transition-all`}>
                      <AvatarFallback className={isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Username and level */}
                  <div className="text-center">
                    <p className={`text-xs font-bold ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      {isMe ? 'You' : user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">Lvl {user.level}</p>
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
