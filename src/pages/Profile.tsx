import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, TrendingUp, Award, Calendar, Zap, Target, Crown, Lock } from "lucide-react";
import { loadProgress, getUnlockedRewards, getLevelRewards, getXPForLevel } from "@/lib/xpSystem";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardUser {
  id: string;
  username: string;
  level: number;
  total_xp: number;
  current_xp: number;
}

const Profile = () => {
  const [userProgress, setUserProgress] = useState(loadProgress());
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  
  useEffect(() => {
    setUserProgress(loadProgress());
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else if (data) {
        // Add current user if not in database
        const currentUser: LeaderboardUser = {
          id: 'current-user',
          username: 'Jane Doe',
          level: userProgress.level,
          total_xp: userProgress.totalXP,
          current_xp: userProgress.currentXP,
        };

        // Check if current user already exists in data
        const userExists = data.some(user => user.username === 'Jane Doe');
        
        // Combine and sort by level first, then by total_xp
        const combined = userExists ? data : [...data, currentUser];
        const sorted = combined.sort((a, b) => {
          if (b.level !== a.level) {
            return b.level - a.level; // Sort by level descending
          }
          return b.total_xp - a.total_xp; // Then by total XP descending
        });
        
        setLeaderboardData(sorted);
      }
      setIsLoadingLeaderboard(false);
    };

    fetchLeaderboard();
  }, [userProgress]);

  const unlockedRewards = getUnlockedRewards(userProgress.level);
  const allRewards = getLevelRewards();
  const xpToNextLevel = getXPForLevel(userProgress.level);

  const userStats = {
    name: "Jane Doe",
    level: userProgress.level,
    xp: userProgress.currentXP,
    xpToNextLevel: xpToNextLevel,
    totalResponses: 47,
    streak: 12,
    achievements: unlockedRewards.length,
    rank: "#23",
    joinDate: "January 2025",
  };

  const recentActivity = [
    { date: "Today", action: "Completed work-life balance survey", xp: 50 },
    { date: "Yesterday", action: "Answered 5 quick questions", xp: 250 },
    { date: "2 days ago", action: "Provided detailed feedback", xp: 75 },
    { date: "3 days ago", action: "Completed team collaboration survey", xp: 50 },
  ];

  const xpProgress = (userStats.xp / userStats.xpToNextLevel) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="mb-8">
        <Card className="p-8 shadow-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-2 border-primary/10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-2xl">
                JD
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-accent flex items-center justify-center border-4 border-background shadow-lg">
                <span className="text-sm font-bold text-accent-foreground">{userStats.level}</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{userStats.name}</h1>
                <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0">
                  Level {userStats.level}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Member since {userStats.joinDate} • Rank {userStats.rank}
              </p>

              {/* XP Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to Level {userStats.level + 1}</span>
                  <span className="font-semibold">
                    {userStats.xp} / {userStats.xpToNextLevel} XP
                  </span>
                </div>
                <Progress value={xpProgress} className="h-3" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 md:ml-auto">
              <div className="text-center p-3 bg-card rounded-lg border border-border">
                <p className="text-2xl font-bold text-primary">{userStats.totalResponses}</p>
                <p className="text-xs text-muted-foreground">Responses</p>
              </div>
              <div className="text-center p-3 bg-card rounded-lg border border-border">
                <p className="text-2xl font-bold text-secondary">{userStats.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center p-3 bg-card rounded-lg border border-border">
                <p className="text-2xl font-bold text-accent">{userStats.achievements}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Global Leaderboard</h3>
                <p className="text-sm text-muted-foreground">Top performers ranked by total XP</p>
              </div>
            </div>

            {isLoadingLeaderboard ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.map((user, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  const isCurrentUser = user.username === 'Jane Doe';
                  const medalColors = {
                    1: "text-yellow-500",
                    2: "text-gray-400",
                    3: "text-amber-600"
                  };

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all animate-fade-in ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/50 hover:border-primary/70 ring-2 ring-primary/30"
                          : isTopThree
                          ? "bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 hover:border-primary/40"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                        {isTopThree ? (
                          <Crown className={`h-8 w-8 ${medalColors[rank as 1 | 2 | 3]}`} />
                        ) : (
                          <div className="text-2xl font-bold text-muted-foreground">
                            {rank}
                          </div>
                        )}
                      </div>

                      {/* User Avatar */}
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        isTopThree
                          ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {user.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${isTopThree ? "text-lg" : ""}`}>
                          {user.username}
                          {isCurrentUser && (
                            <Badge className="ml-2 bg-primary text-primary-foreground border-0 text-xs">
                              You
                            </Badge>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Level {user.level}</span>
                          <span>•</span>
                          <span>{user.current_xp} XP</span>
                        </div>
                      </div>

                      {/* Total XP Badge */}
                      <Badge className={`${
                        isTopThree
                          ? "bg-primary text-primary-foreground border-0 text-lg px-4 py-1"
                          : "bg-muted text-muted-foreground border-0"
                      }`}>
                        <Trophy className="h-4 w-4 mr-1" />
                        {user.total_xp.toLocaleString()} XP
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRewards.map((reward, index) => {
              const isUnlocked = reward.level <= userProgress.level;
              
              return (
                <Card
                  key={reward.level}
                  className={`p-6 shadow-lg transition-all animate-fade-in ${
                    !isUnlocked ? "opacity-60" : "hover:scale-105 hover:shadow-xl"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="space-y-4">
                    {/* Icon and Level */}
                    <div className="flex items-start justify-between">
                      <div className={`text-5xl ${
                        isUnlocked ? "" : "grayscale opacity-50"
                      }`}>
                        {reward.icon}
                      </div>
                      <Badge variant={isUnlocked ? "default" : "secondary"} className="text-xs">
                        Level {reward.level}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                        {reward.title}
                        {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {reward.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-border">
                      {isUnlocked ? (
                        <div className="flex items-center gap-2 text-success">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-semibold">Unlocked!</span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Unlock at Level {reward.level}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6 shadow-lg">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">+{activity.xp} XP</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Participation Rate</span>
                    <span className="font-semibold">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-semibold">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Detailed Responses</span>
                    <span className="font-semibold">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Milestones
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                    <Award className="h-4 w-4 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">First Survey</p>
                    <p className="text-xs text-muted-foreground">Completed Jan 15</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">50 Responses</p>
                    <p className="text-xs text-muted-foreground">Reached Feb 10</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                    <Zap className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Level 5</p>
                    <p className="text-xs text-muted-foreground">Achieved Feb 18</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
