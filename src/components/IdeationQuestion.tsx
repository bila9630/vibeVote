import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Clock, Zap, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { HorseRaceAnimation } from "@/components/HorseRaceAnimation";
import { WordCloudResults } from "@/components/WordCloudResults";
import { supabase } from "@/integrations/supabase/client";
import { UserProgress, addXP, saveProgress } from "@/lib/xpSystem";

interface IdeationQuestionProps {
  questionId: string;
  questionText: string;
  xpReward: number;
  userProgress: UserProgress;
  setUserProgress: (progress: UserProgress) => void;
  answeredQuestions: string[];
  setAnsweredQuestions: (questions: string[]) => void;
  onClose: () => void;
  onLevelUp: (rewards: any[]) => void;
}

export function IdeationQuestion({
  questionId,
  questionText,
  xpReward,
  userProgress,
  setUserProgress,
  answeredQuestions,
  setAnsweredQuestions,
  onClose,
  onLevelUp,
}: IdeationQuestionProps) {
  const ideationInputRef = useRef<HTMLInputElement>(null);
  
  const [ideationStarted, setIdeationStarted] = useState(false);
  const [ideationTimeLeft, setIdeationTimeLeft] = useState(60);
  const [ideationIdeas, setIdeationIdeas] = useState<string[]>([]);
  const [ideationInput, setIdeationInput] = useState("");
  const [ideationScore, setIdeationScore] = useState(0);
  const [ideationCombo, setIdeationCombo] = useState(0);
  const [lastIdeaTime, setLastIdeaTime] = useState<number>(Date.now());
  const [showCoolingWarning, setShowCoolingWarning] = useState(false);
  const [ideationComplete, setIdeationComplete] = useState(false);
  const [horseSpeed, setHorseSpeed] = useState(0);
  const [showWordCloud, setShowWordCloud] = useState(false);

  const startIdeationGame = () => {
    setIdeationStarted(true);
    setIdeationTimeLeft(60);
    setIdeationIdeas([]);
    setIdeationScore(0);
    setIdeationCombo(0);
    setLastIdeaTime(Date.now());
    setShowCoolingWarning(false);
    setIdeationComplete(false);
    setHorseSpeed(0);
    setTimeout(() => ideationInputRef.current?.focus(), 100);
  };
  
  const playPopSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };
  
  const submitIdeationIdea = () => {
    const idea = ideationInput.trim();
    if (!idea || !ideationStarted) return;
    
    // Validation: Check for meaningful input
    if (idea.length < 3) {
      toast.error("Idea too short!", {
        description: "Please provide at least 3 characters.",
        duration: 2000,
      });
      return;
    }
    
    // Check if it contains at least one letter (not just symbols/numbers)
    if (!/[a-zA-Z]/.test(idea)) {
      toast.error("Invalid input!", {
        description: "Please enter a valid idea with actual words.",
        duration: 2000,
      });
      return;
    }
    
    // Check if it's mostly random characters (more than 50% non-alphanumeric)
    const alphanumericCount = (idea.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericCount / idea.length < 0.5) {
      toast.error("Invalid input!", {
        description: "Please enter meaningful text.",
        duration: 2000,
      });
      return;
    }
    
    const now = Date.now();
    const timeSinceLastIdea = (now - lastIdeaTime) / 1000;
    
    // Calculate combo bonus
    let comboBonus = 0;
    if (timeSinceLastIdea < 3) {
      setIdeationCombo(ideationCombo + 1);
      comboBonus = (ideationCombo + 1) * 50;
    } else {
      setIdeationCombo(0);
    }
    
    const points = 100 + comboBonus;
    setIdeationScore(ideationScore + points);
    setIdeationIdeas([...ideationIdeas, idea]);
    setIdeationInput("");
    setLastIdeaTime(now);
    setShowCoolingWarning(false);
    
    // Speed up horse
    setHorseSpeed(Math.min(10, 5 + ideationCombo));
    
    playPopSound();
    
    if (comboBonus > 0) {
      toast.success(`💡 ${idea}`, {
        description: `+${points} XP! (${ideationCombo + 1}x combo!)`,
        duration: 1500,
      });
    } else {
      toast.success(`💡 ${idea}`, {
        description: `+${points} XP!`,
        duration: 1500,
      });
    }
  };
  
  const handleIdeationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitIdeationIdea();
    }
  };
  
  const completeIdeationGame = async () => {
    // Evaluate ideation ideas with AI
    let earnedXP = xpReward;
    let evaluationReason = `${ideationIdeas.length} ideas generated!`;
    
    if (ideationIdeas.length > 0) {
      try {
        const { data: evalData, error: evalError } = await supabase.functions.invoke('evaluate-response', {
          body: {
            question: questionText,
            answer: ideationIdeas.join(', '),
            questionType: 'ideation'
          }
        });

        if (evalError) {
          console.error('Error evaluating ideation response:', evalError);
        } else if (evalData) {
          earnedXP = evalData.xp;
          evaluationReason = evalData.reason;
        }
      } catch (error) {
        console.error('Error calling evaluation function:', error);
      }
    }

    // Save all ideas to database
    const { error } = await supabase
      .from('user_responses')
      .insert({
        question_id: questionId,
        response_text: ideationIdeas.join(', '),
      });

    if (error) {
      console.error('Error saving ideation response:', error);
      toast.error('Failed to save ideas');
      return;
    }

    const totalXP = earnedXP + ideationScore;
    toast.success(`+${totalXP} XP!`, {
      description: evaluationReason,
      icon: <Lightbulb className="h-4 w-4 text-accent" />,
    });
    
    // Add XP and check for level up
    const xpResult = addXP(userProgress, totalXP);
    setUserProgress(xpResult.newProgress);
    saveProgress(xpResult.newProgress);
    
    // Dispatch custom event for sidebar to update
    window.dispatchEvent(new Event('xpUpdated'));
    
    if (xpResult.leveledUp) {
      onLevelUp(xpResult.newRewards);
    }
    
    setAnsweredQuestions([...answeredQuestions, questionId]);
    
    // Show word cloud results instead of closing immediately
    setShowWordCloud(true);
  };

  const handleWordCloudClose = () => {
    setShowWordCloud(false);
    setIdeationStarted(false);
    setIdeationComplete(false);
    onClose();
  };

  const handleWordCloudCancel = () => {
    setShowWordCloud(false);
    setIdeationStarted(false);
    setIdeationComplete(false);
    onClose();
  };
  
  // Timer and idle detection for ideation game
  useEffect(() => {
    if (!ideationStarted || ideationComplete) return;
    
    const timer = setInterval(() => {
      setIdeationTimeLeft((prev) => {
        if (prev <= 1) {
          setIdeationStarted(false);
          setIdeationComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [ideationStarted, ideationComplete]);
  
  useEffect(() => {
    if (!ideationStarted || ideationComplete) return;
    
    const idleCheck = setInterval(() => {
      const timeSinceLastIdea = (Date.now() - lastIdeaTime) / 1000;
      
      // Stop horse after 5 seconds, show warning after 3 seconds
      if (timeSinceLastIdea >= 5) {
        setHorseSpeed(0);
        setShowCoolingWarning(true);
      } else if (timeSinceLastIdea >= 3) {
        setShowCoolingWarning(true);
      } else {
        setShowCoolingWarning(false);
      }
    }, 100);
    
    return () => clearInterval(idleCheck);
  }, [ideationStarted, lastIdeaTime, ideationComplete]);

  // Render not started state
  if (!ideationStarted && !ideationComplete) {
    return (
      <div className="text-center space-y-4">
        <Lightbulb className="h-16 w-16 text-primary mx-auto animate-pulse" />
        <div>
          <h3 className="text-2xl font-semibold mb-2">Idea Sprint Challenge</h3>
          <p className="text-muted-foreground">
            You have 60 seconds to generate as many creative ideas as possible. Type one idea per line and hit Enter to submit!
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" onClick={startIdeationGame}>
            <Zap className="h-5 w-5 mr-2" />
            Start Idea Sprint
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Render started state
  if (ideationStarted && !ideationComplete) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <span className="text-3xl font-bold">{ideationTimeLeft}s</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{ideationScore} XP</div>
            {ideationCombo > 0 && (
              <Badge className="animate-pulse" variant="default">
                <Zap className="h-3 w-3 mr-1" />
                {ideationCombo}x Combo!
              </Badge>
            )}
          </div>
        </div>
        
        <HorseRaceAnimation isActive={ideationStarted} speed={horseSpeed} />
        
        <Progress value={(ideationTimeLeft / 60) * 100} className="h-2" />
        
        {showCoolingWarning && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-pulse">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {horseSpeed === 0 
                ? "⚠️ Horse stopped! Submit an idea to keep racing!" 
                : "⚠️ Horse is slowing down! Submit ideas quickly!"}
            </span>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              ref={ideationInputRef}
              value={ideationInput}
              onChange={(e) => setIdeationInput(e.target.value)}
              onKeyPress={handleIdeationKeyPress}
              placeholder="Type your idea and press Enter..."
              className="flex-1 text-base"
              autoFocus
            />
            <Button onClick={submitIdeationIdea} disabled={!ideationInput.trim()}>
              <Zap className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {ideationIdeas.length} ideas generated • Keep the momentum going!
          </p>
        </div>
        
        <div className="max-h-[30vh] overflow-y-auto space-y-2 pr-2">
          {ideationIdeas.map((idea, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg animate-scale-in"
            >
              <span className="text-2xl animate-bounce">💡</span>
              <span className="flex-1 pt-1">{idea}</span>
              <Badge variant="secondary">+{ideationIdeas.length - idx <= 3 && ideationCombo > 0 ? 100 + ideationCombo * 50 : 100}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show word cloud results after completion
  if (showWordCloud) {
    return (
      <WordCloudResults
        questionId={questionId}
        question={questionText}
        onClose={handleWordCloudClose}
        onCancel={handleWordCloudCancel}
      />
    );
  }

  // Render complete state
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="text-center">
        <Lightbulb className="h-16 w-16 text-success mx-auto mb-4" />
        <h3 className="text-3xl font-semibold mb-2">Time's Up! Amazing Work! 🎉</h3>
        <p className="text-muted-foreground">
          You generated {ideationIdeas.length} creative ideas in 60 seconds!
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{ideationIdeas.length}</div>
          <div className="text-sm text-muted-foreground">Total Ideas</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{ideationScore}</div>
          <div className="text-sm text-muted-foreground">Bonus XP</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-xl font-semibold">Your Ideas:</h4>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {ideationIdeas.map((idea, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {idx + 1}
              </div>
              <span className="flex-1 pt-1">{idea}</span>
              <span className="text-lg">💡</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="sticky bottom-0 bg-card pt-4">
        <Button className="w-full" onClick={completeIdeationGame}>
          Complete & Earn {xpReward + ideationScore} XP
        </Button>
      </div>
    </div>
  );
}
