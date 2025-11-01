import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, TrendingUp, Award, Calendar, Zap, Target, Crown } from "lucide-react";

const Profile = () => {
  const userStats = {
    name: "Jane Doe",
    level: 5,
    xp: 850,
    xpToNextLevel: 1000,
    totalResponses: 47,
    streak: 12,
    achievements: 8,
    rank: "#23",
    joinDate: "January 2025",
  };

  const achievements = [
    { id: 1, name: "Early Bird", description: "Completed 10 surveys", icon: Star, unlocked: true },
    { id: 2, name: "Feedback Hero", description: "50 responses submitted", icon: Trophy, unlocked: true },
    { id: 3, name: "Streak Master", description: "10 day participation streak", icon: Zap, unlocked: true },
    { id: 4, name: "Top Contributor", description: "Top 25 in monthly rankings", icon: Crown, unlocked: true },
    { id: 5, name: "Detail Oriented", description: "20 detailed open responses", icon: Target, unlocked: false },
    { id: 6, name: "Team Player", description: "Participate for 3 months", icon: Award, unlocked: false },
  ];

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
      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Card
                  key={achievement.id}
                  className={`p-6 shadow-md transition-all animate-fade-in ${
                    achievement.unlocked
                      ? "border-primary/20 hover:shadow-lg hover:scale-105"
                      : "opacity-60"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        achievement.unlocked
                          ? "bg-gradient-to-br from-primary to-secondary"
                          : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          achievement.unlocked ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {achievement.unlocked && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Unlocked
                        </Badge>
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
