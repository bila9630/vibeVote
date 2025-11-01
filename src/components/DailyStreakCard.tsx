import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface DailyStreakCardProps {
  isMobile: boolean;
}

export function DailyStreakCard({ isMobile }: DailyStreakCardProps) {
  // Always show 3 consecutive days
  const days = [
    { day: 'W', completed: true }, 
    { day: 'T', completed: true }, 
    { day: 'F', completed: false }
  ];

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-[#F59E0B] to-[#F97316] border-0 shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Streak</h2>
            <p className="text-white/90 font-medium">Keep it going!</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Flame className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Streak Progress */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-[calc(50%+12px)] left-0 right-0 h-1 bg-white/30" 
               style={{ left: '10%', right: '10%', width: '80%' }} />
          
          {/* Progress Line */}
          <div className="absolute top-[calc(50%+12px)] left-0 h-1 bg-white" 
               style={{ left: '10%', width: '47%' }} />

          {/* Days with Circles */}
          <div className="flex items-center justify-between relative">
            {days.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-3">
                <p className="text-white/70 text-sm font-medium">{item.day}</p>
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                    item.completed
                      ? 'bg-white shadow-lg'
                      : 'bg-white/30 backdrop-blur-sm border-2 border-white'
                  }`}
                >
                  {item.completed && (
                    <svg
                      className="h-5 w-5 text-[#F59E0B]"
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
