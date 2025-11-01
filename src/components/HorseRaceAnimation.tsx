import { useEffect, useState } from "react";

interface HorseRaceAnimationProps {
  isActive: boolean;
  speed: number; // 0-10 scale
}

export const HorseRaceAnimation = ({ isActive, speed }: HorseRaceAnimationProps) => {
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    if (!isActive) {
      setPosition(0);
      return;
    }
    
    if (speed === 0) return;
    
    const interval = setInterval(() => {
      setPosition((prev) => {
        const newPos = prev + speed * 0.08;
        return newPos >= 95 ? 0 : newPos;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive, speed]);
  
  const animationSpeed = speed === 0 ? 0 : Math.max(0.3, 2 - (speed / 10));
  
  return (
    <div className="relative w-full h-32 bg-gradient-to-b from-sky-200 to-green-200 rounded-lg overflow-hidden border-4 border-primary/20">
      {/* Sky background */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-sky-300 to-sky-200" />
      
      {/* Track lines */}
      <div className="absolute inset-0 flex flex-col justify-end pb-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="h-px bg-white/30"
            style={{ marginBottom: '4px' }}
          />
        ))}
      </div>
      
      {/* Racing track gradient */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-green-400/50 to-green-600/50" />
      
      {/* Horse - running from left to right */}
      <div 
        className="absolute bottom-6 transition-all duration-100"
        style={{ 
          left: `${position}%`,
          transform: `scale(${speed === 0 ? 1 : 1.1}) scaleX(-1)`,
        }}
      >
        <div className="relative">
          {/* Horse emoji with animation */}
          <div 
            className="text-6xl leading-none"
            style={{
              animation: speed > 0 
                ? `gallop ${animationSpeed}s ease-in-out infinite`
                : 'none',
              filter: speed === 0 ? 'grayscale(50%) opacity(0.7)' : 'grayscale(0%)',
            }}
          >
            🏇
          </div>
          
          {/* Speed lines when fast - behind the horse */}
          {speed > 5 && (
            <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 transform scale-x-[-1]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1 bg-primary/40 rounded-full mb-2"
                  style={{
                    width: `${15 - i * 3}px`,
                    animation: `speedLine 0.3s ease-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Speed indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
        <div className="flex gap-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-4 rounded-full transition-all ${
                i < speed
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Status text */}
      {speed === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-destructive animate-pulse">
            <span className="text-sm font-semibold text-destructive">
              Horse stopped! Generate ideas to keep racing!
            </span>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes gallop {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes speedLine {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-15px); }
        }
      `}</style>
    </div>
  );
};
