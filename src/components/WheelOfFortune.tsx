import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles } from "lucide-react";

export interface Prize {
  id: number;
  name: string;
  xp: number;
  color: string;
}

const prizes: Prize[] = [
  { id: 1, name: "Double XP", xp: 100, color: "hsl(var(--primary))" },
  { id: 2, name: "Bonus Points", xp: 50, color: "hsl(var(--accent))" },
  { id: 3, name: "Lucky Streak", xp: 75, color: "hsl(var(--secondary))" },
  { id: 4, name: "Mega Reward", xp: 150, color: "hsl(var(--destructive))" },
  { id: 5, name: "XP Boost", xp: 80, color: "hsl(var(--chart-1))" },
  { id: 6, name: "Jackpot", xp: 200, color: "hsl(var(--chart-2))" },
];

interface WheelOfFortuneProps {
  onComplete: (prize: Prize) => void;
}

export const WheelOfFortune = ({ onComplete }: WheelOfFortuneProps) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const spinWheel = () => {
    setSpinning(true);
    setSelectedPrize(null);

    // Random prize selection
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    
    // Calculate rotation to land on selected prize
    const prizeAngle = 360 / prizes.length;
    const prizeIndex = prizes.indexOf(randomPrize);
    const targetAngle = 360 - (prizeIndex * prizeAngle + prizeAngle / 2);
    const spins = 5; // Number of full rotations
    const finalRotation = spins * 360 + targetAngle;

    setRotation(finalRotation);

    // Show result after animation
    setTimeout(() => {
      setSpinning(false);
      setSelectedPrize(randomPrize);
      setTimeout(() => {
        onComplete(randomPrize);
      }, 2000);
    }, 4000);
  };

  useEffect(() => {
    // Auto-spin on mount
    const timer = setTimeout(() => spinWheel(), 500);
    return () => clearTimeout(timer);
  }, []);

  const segmentAngle = 360 / prizes.length;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-2xl w-full p-8 shadow-2xl animate-scale-in">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Gift className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Wheel of Fortune!</h2>
            <p className="text-muted-foreground">Spinning for your bonus reward...</p>
          </div>

          {/* Wheel Container */}
          <div className="relative flex justify-center items-center py-8">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <div className="relative w-80 h-80">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full transition-transform duration-[4000ms] ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {/* Draw segments */}
                {prizes.map((prize, index) => {
                  const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
                  const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
                  
                  const x1 = 100 + 90 * Math.cos(startAngle);
                  const y1 = 100 + 90 * Math.sin(startAngle);
                  const x2 = 100 + 90 * Math.cos(endAngle);
                  const y2 = 100 + 90 * Math.sin(endAngle);

                  const largeArc = segmentAngle > 180 ? 1 : 0;

                  return (
                    <g key={prize.id}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={prize.color}
                        stroke="hsl(var(--background))"
                        strokeWidth="2"
                      />
                      <text
                        x="100"
                        y="100"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        transform={`rotate(${index * segmentAngle + segmentAngle / 2} 100 100) translate(0 -50)`}
                      >
                        {prize.name}
                      </text>
                    </g>
                  );
                })}

                {/* Center circle */}
                <circle cx="100" cy="100" r="20" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="3" />
                <circle cx="100" cy="100" r="10" fill="hsl(var(--primary))" />
              </svg>
            </div>
          </div>

          {/* Result */}
          {selectedPrize && !spinning && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="flex justify-center">
                <Sparkles className="h-12 w-12 text-accent animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Congratulations!</h3>
                <p className="text-xl">You won: <span className="font-bold text-primary">{selectedPrize.name}</span></p>
                <p className="text-3xl font-bold text-accent">+{selectedPrize.xp} XP</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
