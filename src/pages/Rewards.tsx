import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Lock, TreePine, ArrowRight, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loadProgress, getUnlockedRewards, getLevelRewards } from "@/lib/xpSystem";
import { useState, useEffect } from "react";

const Rewards = () => {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState(loadProgress());
  const totalTreesPlanted = 127;
  
  useEffect(() => {
    // Reload progress when component mounts
    setUserProgress(loadProgress());
  }, []);

  const unlockedRewards = getUnlockedRewards(userProgress.level);
  const allRewards = getLevelRewards();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Achievements & Rewards</h1>
        <p className="text-muted-foreground">Your progress and unlocked milestones</p>
      </div>

      {/* Level and XP Card */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Progress</p>
            <p className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="h-10 w-10 text-primary" />
              Level {userProgress.level}
            </p>
            <p className="text-lg text-muted-foreground">
              {userProgress.totalXP} Total XP Earned
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Unlocked</p>
            <p className="text-3xl font-bold text-primary">
              {unlockedRewards.length} / {allRewards.length}
            </p>
            <p className="text-sm text-muted-foreground">Achievements</p>
          </div>
        </div>
      </Card>

      {/* Tree Impact Card */}
      <Card 
        className="p-6 mb-8 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-green-500/20 shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        onClick={() => navigate('/trees')}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TreePine className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Environmental Impact</p>
            </div>
            <p className="text-3xl font-bold mb-1">{totalTreesPlanted} Trees Planted</p>
            <p className="text-sm text-muted-foreground">By our community members</p>
          </div>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* Achievements Grid */}
      <h2 className="text-2xl font-bold mb-4">Your Achievements</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

      {/* Info Card */}
      <Card className="p-6 mt-8 bg-muted/50">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          How to earn more XP?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Answer questions: <span className="font-semibold text-foreground">50 XP</span> per question</li>
          <li>• Complete daily surveys: <span className="font-semibold text-foreground">100 XP</span> bonus</li>
          <li>• Provide detailed feedback: <span className="font-semibold text-foreground">Extra 25 XP</span></li>
          <li>• Weekly participation streak: <span className="font-semibold text-foreground">200 XP</span> bonus</li>
        </ul>
      </Card>
    </div>
  );
};

export default Rewards;
