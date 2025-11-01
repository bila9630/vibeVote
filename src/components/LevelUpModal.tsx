import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { LevelReward, UserProgress } from "@/lib/xpSystem";

interface LevelUpModalProps {
  show: boolean;
  userProgress: UserProgress;
  newRewards: LevelReward[];
  onClose: () => void;
}

export const LevelUpModal = ({ show, userProgress, newRewards, onClose }: LevelUpModalProps) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <Card 
        className="max-w-lg w-full p-8 shadow-2xl animate-scale-in border-2 border-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Trophy className="h-24 w-24 mx-auto text-primary/20" />
            </div>
            <Trophy className="h-24 w-24 mx-auto text-primary relative" />
          </div>
          
          <div>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Level Up!
            </h2>
            <p className="text-5xl font-bold mb-4">Level {userProgress.level}</p>
            <p className="text-muted-foreground">
              You've reached a new milestone!
            </p>
          </div>

          {newRewards.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">🎁 New Rewards Unlocked!</h3>
              {newRewards.map((reward, index) => (
                <Card key={index} className="p-4 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{reward.icon}</span>
                    <div className="text-left flex-1">
                      <h4 className="font-semibold">{reward.title}</h4>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Button 
            size="lg"
            className="w-full" 
            onClick={onClose}
          >
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
};
