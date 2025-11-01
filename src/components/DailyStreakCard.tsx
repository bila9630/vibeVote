import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface DailyStreakCardProps {
  isMobile: boolean;
}

export function DailyStreakCard({ isMobile }: DailyStreakCardProps) {
  // Always show 3 consecutive days with full names
  const days = [
    { day: 'Wednesday', short: 'Wed', completed: true }, 
    { day: 'Thursday', short: 'Thu', completed: true }, 
    { day: 'Friday', short: 'Fri', completed: false }
  ];

  const currentStreak = days.filter(d => d.completed).length;

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-[#F59E0B] to-[#F97316] border-0 shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{currentStreak}-day Streak</h2>
            <p className="text-white/90 font-medium">Keep it going!</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Flame className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Streak Progress */}
        <div className="relative px-2">
          {/* Connection Line */}
          <div className="absolute top-[calc(50%+16px)] left-0 right-0 h-1 bg-white/30" 
               style={{ left: '15%', right: '15%', width: '70%' }} />
          
          {/* Progress Line */}
          <div className="absolute top-[calc(50%+16px)] left-0 h-1 bg-white" 
               style={{ left: '15%', width: '35%' }} />

          {/* Days with Circles */}
          <div className="flex items-center justify-around relative">
            {days.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-3 flex-1">
                <p className="text-white/80 text-sm font-semibold">
                  {isMobile ? item.short : item.day}
                </p>
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                    item.completed
                      ? 'bg-white shadow-lg'
                      : 'bg-white/30 backdrop-blur-sm border-2 border-white'
                  }`}
                >
                  {item.completed && (
                    <svg
                      className="h-6 w-6 text-[#F59E0B]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
