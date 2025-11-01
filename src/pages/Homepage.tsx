import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, Clock, ThumbsUp, ThumbsDown, ChevronRight, Flame, Trophy, Lightbulb, Zap, AlertTriangle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { HorseRaceAnimation } from "@/components/HorseRaceAnimation";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserProgress, 
  LevelReward, 
  loadProgress, 
  saveProgress, 
  addXP, 
  getXPForLevel,
  getUnlockedRewards
} from "@/lib/xpSystem";

type QuestionType = "multiple-choice" | "open-ended" | "yes-no" | "ranking" | "ideation";

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  rankingOptions?: Array<{ name: string; emoji: string; wins: number }>;
  category: string;
  xpReward: number;
  timeAgo: string;
}

// Questions are now loaded from the database

const Homepage = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("new");
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const ideationInputRef = useRef<HTMLInputElement>(null);
  
  // Ranking game state
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [remainingOptions, setRemainingOptions] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState<any[]>([]);
  const [winner, setWinner] = useState<any>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [userRanking, setUserRanking] = useState<any[]>([]);
  
  // Ideation game state
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

  // Vote distribution state
  const [showVoteDistribution, setShowVoteDistribution] = useState(false);
  const [voteDistribution, setVoteDistribution] = useState<{ option: string; count: number; percentage: number }[]>([]);

  // XP and leveling state
  const [userProgress, setUserProgress] = useState<UserProgress>(loadProgress());
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRewards, setNewRewards] = useState<LevelReward[]>([]);
  
  // Reload progress when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setUserProgress(loadProgress());
      }
    };
    
    // Reload on mount
    setUserProgress(loadProgress());
    
    // Reload when tab becomes visible
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load questions from database
  useEffect(() => {
    const loadQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading questions:', error);
        toast.error('Failed to load questions');
        return;
      }

      if (data) {
        const formattedQuestions: Question[] = data.map((q) => {
          const options = q.options as any;
          const timeDiff = Date.now() - new Date(q.created_at).getTime();
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
          const daysAgo = Math.floor(hoursAgo / 24);
          
          let timeAgo = '';
          if (daysAgo > 0) {
            timeAgo = `${daysAgo}d ago`;
          } else {
            timeAgo = `${hoursAgo}h ago`;
          }

          return {
            id: q.id,
            type: q.question_type as QuestionType,
            question: q.question_text,
            options: options?.options,
            rankingOptions: options?.rankingOptions,
            category: q.category,
            xpReward: q.xp_reward,
            timeAgo,
          };
        });
        setAvailableQuestions(formattedQuestions);
      }
    };

    loadQuestions();
  }, []);

  const handleStartQuestion = (question: Question) => {
    setCurrentQuestion(question);
  };

  const handleAnswer = async (answer: string) => {
    if (currentQuestion) {
      // Evaluate response with AI for open-ended questions
      let earnedXP = currentQuestion.xpReward;
      let evaluationReason = "Answer submitted successfully!";
      
      if (currentQuestion.type === 'open-ended') {
        try {
          const { data: evalData, error: evalError } = await supabase.functions.invoke('evaluate-response', {
            body: {
              question: currentQuestion.question,
              answer: answer,
              questionType: currentQuestion.type
            }
          });

          if (evalError) {
            console.error('Error evaluating response:', evalError);
          } else if (evalData) {
            earnedXP = evalData.xp;
            evaluationReason = evalData.reason;
          }
        } catch (error) {
          console.error('Error calling evaluation function:', error);
        }
      }

      // Save response to database
      const { error } = await supabase
        .from('user_responses')
        .insert({
          question_id: currentQuestion.id,
          selected_option: currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'yes-no' ? answer : null,
          response_text: currentQuestion.type === 'open-ended' ? answer : null,
        });

      if (error) {
        console.error('Error saving response:', error);
        toast.error('Failed to save answer');
        return;
      }

      toast.success(`+${earnedXP} XP!`, {
        description: evaluationReason,
        icon: <Star className="h-4 w-4 text-accent" />,
      });
      
      // Add XP and check for level up
      const xpResult = addXP(userProgress, earnedXP);
      setUserProgress(xpResult.newProgress);
      saveProgress(xpResult.newProgress);
      
      // Dispatch custom event for sidebar to update
      window.dispatchEvent(new Event('xpUpdated'));
      
      if (xpResult.leveledUp) {
        setNewRewards(xpResult.newRewards);
        setShowLevelUp(true);
      }
      
      // For multiple choice and yes/no, show vote distribution
      if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'yes-no') {
        // Fetch vote distribution
        const { data: responses, error: fetchError } = await supabase
          .from('user_responses')
          .select('selected_option')
          .eq('question_id', currentQuestion.id);

        if (!fetchError && responses) {
          // Count votes
          const voteCounts: { [key: string]: number } = {};
          const options = currentQuestion.type === 'yes-no' 
            ? ['Yes', 'No'] 
            : (currentQuestion.options || []);
          
          options.forEach(opt => {
            voteCounts[opt] = 0;
          });

          responses.forEach(r => {
            if (r.selected_option && voteCounts.hasOwnProperty(r.selected_option)) {
              voteCounts[r.selected_option]++;
            }
          });

          const total = responses.length;
          const distribution = options.map(opt => ({
            option: opt,
            count: voteCounts[opt],
            percentage: total > 0 ? (voteCounts[opt] / total) * 100 : 0
          }));

          setVoteDistribution(distribution);
          setShowVoteDistribution(true);
        }
      } else {
        // For other question types, move to next immediately
        const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
        setAnsweredQuestions(newAnsweredQuestions);
        setOpenAnswer("");
        
        const nextQuestion = availableQuestions.find(
          (q) => !newAnsweredQuestions.includes(q.id)
        );
        
        setCurrentQuestion(nextQuestion || null);
      }
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    const answer = direction === "right" ? "Yes" : "No";
    handleAnswer(answer);
  };
  
  const startRankingGame = () => {
    if (currentQuestion?.rankingOptions) {
      const shuffled = [...currentQuestion.rankingOptions].sort(() => Math.random() - 0.5);
      setRemainingOptions(shuffled);
      setCurrentPair([shuffled[0], shuffled[1]]);
      setGameStarted(true);
      setCurrentRound(1);
      setGameComplete(false);
      setUserRanking([]);
    }
  };
  
  const handleRankingChoice = (chosen: any, notChosen: any) => {
    const updatedRanking = [...userRanking];
    const chosenIndex = updatedRanking.findIndex(item => item.name === chosen.name);
    
    if (chosenIndex === -1) {
      updatedRanking.push({ ...chosen, wins: 1 });
    } else {
      updatedRanking[chosenIndex].wins += 1;
    }
    
    setUserRanking(updatedRanking);
    
    if (currentRound >= 10) {
      // Game complete after 10 rounds
      setWinner(chosen);
      setGameComplete(true);
    } else {
      // Create a pool of options excluding the current winner
      const availableOpponents = remainingOptions.filter(opt => opt.name !== chosen.name);
      
      // Find the next opponent that's not the one just defeated
      let nextOpponent;
      const notChosenIndex = availableOpponents.findIndex(opt => opt.name === notChosen.name);
      
      if (notChosenIndex !== -1 && availableOpponents.length > 1) {
        // Get the next option after the defeated one (wrap around if needed)
        const nextIndex = (notChosenIndex + 1) % availableOpponents.length;
        nextOpponent = availableOpponents[nextIndex];
      } else {
        // Fallback: just pick the first available opponent
        nextOpponent = availableOpponents[0];
      }
      
      setCurrentPair([chosen, nextOpponent]);
      setCurrentRound(currentRound + 1);
    }
  };
  
  const completeRankingGame = async () => {
    if (currentQuestion) {
      // Save ranking to database
      const rankingResult = userRanking.map((item, index) => 
        `${index + 1}. ${item.name}`
      ).join(', ');

      const { error } = await supabase
        .from('user_responses')
        .insert({
          question_id: currentQuestion.id,
          response_text: rankingResult,
        });

      if (error) {
        console.error('Error saving ranking response:', error);
        toast.error('Failed to save ranking');
        return;
      }

      toast.success(`+${currentQuestion.xpReward} XP!`, {
        description: "Ranking complete!",
        icon: <Trophy className="h-4 w-4 text-accent" />,
      });
      
      // Add XP and check for level up
      const xpResult = addXP(userProgress, currentQuestion.xpReward);
      setUserProgress(xpResult.newProgress);
      saveProgress(xpResult.newProgress);
      
      // Dispatch custom event for sidebar to update
      window.dispatchEvent(new Event('xpUpdated'));
      
      if (xpResult.leveledUp) {
        setNewRewards(xpResult.newRewards);
        setShowLevelUp(true);
      }
      
      setAnsweredQuestions([...answeredQuestions, currentQuestion.id]);
      setCurrentQuestion(null);
      setGameStarted(false);
      setGameComplete(false);
      setUserRanking([]);
    }
  };
  
  // Ideation game functions
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
    if (currentQuestion) {
      // Evaluate ideation ideas with AI
      let earnedXP = currentQuestion.xpReward;
      let evaluationReason = `${ideationIdeas.length} ideas generated!`;
      
      if (ideationIdeas.length > 0) {
        try {
          const { data: evalData, error: evalError } = await supabase.functions.invoke('evaluate-response', {
            body: {
              question: currentQuestion.question,
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
          question_id: currentQuestion.id,
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
        setNewRewards(xpResult.newRewards);
        setShowLevelUp(true);
      }
      
      setAnsweredQuestions([...answeredQuestions, currentQuestion.id]);
      setCurrentQuestion(null);
      setIdeationStarted(false);
      setIdeationComplete(false);
    }
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

  const renderQuestionModal = () => {
    if (!currentQuestion) return null;

    return (
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setCurrentQuestion(null)}
      >
        <Card 
          className="max-w-2xl w-full p-8 shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <Badge className="mb-2">{currentQuestion.category}</Badge>
                <h2 className="text-2xl font-bold leading-tight">{currentQuestion.question}</h2>
              </div>
            </div>

            {/* Render based on type */}
            {currentQuestion.type === "multiple-choice" && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full h-auto py-4 text-left justify-start hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => handleAnswer(option)}
                  >
                    <span className="text-lg">{option}</span>
                  </Button>
                ))}
              </div>
            )}

            {currentQuestion.type === "open-ended" && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={openAnswer}
                  onChange={(e) => setOpenAnswer(e.target.value)}
                  className="min-h-[150px] text-base resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleAnswer(openAnswer)}
                    disabled={!openAnswer.trim()}
                  >
                    Submit Answer
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentQuestion(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {currentQuestion.type === "yes-no" && (
              <div className="space-y-6">
                <p className="text-center text-muted-foreground">Choose your answer</p>
                <div className="flex justify-center gap-8">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full h-20 w-20 shadow-xl hover:scale-110 transition-transform"
                    onClick={() => handleSwipe("left")}
                  >
                    <ThumbsDown className="h-8 w-8" />
                  </Button>
                  <Button
                    size="lg"
                    variant="success"
                    className="rounded-full h-20 w-20 shadow-xl hover:scale-110 transition-transform"
                    onClick={() => handleSwipe("right")}
                  >
                    <ThumbsUp className="h-8 w-8" />
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setCurrentQuestion(null)}>
                  Cancel
                </Button>
              </div>
            )}
            
            {/* Ranking Game */}
            {currentQuestion.type === "ranking" && !gameStarted && (
              <div className="text-center space-y-4">
                <Trophy className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Pairwise Ranking Game</h3>
                  <p className="text-muted-foreground">
                    Compare your preferences two at a time. Choose your favorite in each round!
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="lg" className="flex-1" onClick={startRankingGame}>
                    Start Ranking Game
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentQuestion(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {currentQuestion.type === "ranking" && gameStarted && !gameComplete && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge variant="outline" className="mb-4">Round {currentRound} of 10</Badge>
                  <h3 className="text-2xl font-semibold mb-2">Which do you prefer?</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {currentPair.map((option, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="h-32 text-4xl hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
                      onClick={() => handleRankingChoice(option, currentPair[1 - idx])}
                    >
                      {option.emoji}
                      <span className="ml-3 text-lg">{option.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {currentQuestion.type === "ranking" && gameComplete && (
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="text-center">
                  <Trophy className="h-16 w-16 text-success mx-auto mb-4" />
                  <h3 className="text-3xl font-semibold mb-2">Your Ultimate Pick: {winner?.emoji} {winner?.name}</h3>
                  <p className="text-muted-foreground">
                    Your taste profile: Sweet over flaky, comfort over elegance
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-semibold">Your Personal Ranking:</h4>
                  {userRanking
                    .sort((a, b) => b.wins - a.wins)
                    .map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {idx + 1}
                          </div>
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.wins} wins</span>
                      </div>
                    ))}
                </div>
                
                {/* Colleagues' Results Section */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-semibold">Colleagues' Rankings</h4>
                    <Badge variant="secondary">8 responses</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Colleague 1 */}
                    <Card className="p-4 bg-muted/30">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          JD
                        </div>
                        <div>
                          <p className="font-semibold">John Doe</p>
                          <p className="text-sm text-muted-foreground">Marketing Team • 2h ago</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { emoji: "🍩", name: "Donuts", position: 1 },
                          { emoji: "🍬", name: "Macarons", position: 2 },
                          { emoji: "🥐", name: "Croissants", position: 3 },
                        ].map((item) => (
                          <div key={item.position} className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground w-4">#{item.position}</span>
                            <span className="text-lg">{item.emoji}</span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    
                    {/* Colleague 2 */}
                    <Card className="p-4 bg-muted/30">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                          AS
                        </div>
                        <div>
                          <p className="font-semibold">Alice Smith</p>
                          <p className="text-sm text-muted-foreground">Engineering Team • 4h ago</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { emoji: "🥐", name: "Croissants", position: 1 },
                          { emoji: "🍪", name: "Cookies", position: 2 },
                          { emoji: "🧁", name: "Muffins", position: 3 },
                        ].map((item) => (
                          <div key={item.position} className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground w-4">#{item.position}</span>
                            <span className="text-lg">{item.emoji}</span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    
                    {/* Colleague 3 */}
                    <Card className="p-4 bg-muted/30">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                          MJ
                        </div>
                        <div>
                          <p className="font-semibold">Michael Johnson</p>
                          <p className="text-sm text-muted-foreground">Design Team • 5h ago</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { emoji: "🍬", name: "Macarons", position: 1 },
                          { emoji: "🍩", name: "Donuts", position: 2 },
                          { emoji: "🍪", name: "Cookies", position: 3 },
                        ].map((item) => (
                          <div key={item.position} className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground w-4">#{item.position}</span>
                            <span className="text-lg">{item.emoji}</span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    
                    <Button variant="outline" className="w-full">
                      View All 8 Responses
                    </Button>
                  </div>
                </div>
                <div className="sticky bottom-0 bg-card pt-4">
                  <Button className="w-full" onClick={completeRankingGame}>
                    Complete & Earn {currentQuestion.xpReward} XP
                  </Button>
                </div>
              </div>
            )}
            
            {/* Ideation Game */}
            {currentQuestion.type === "ideation" && !ideationStarted && !ideationComplete && (
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
                  <Button variant="outline" onClick={() => setCurrentQuestion(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {currentQuestion.type === "ideation" && ideationStarted && !ideationComplete && (
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
            )}
            
            {currentQuestion.type === "ideation" && ideationComplete && (
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
                    Complete & Earn {currentQuestion.xpReward + ideationScore} XP
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const filteredQuestions = availableQuestions.filter((q) => {
    if (activeTab === "new") return !answeredQuestions.includes(q.id);
    if (activeTab === "completed") return answeredQuestions.includes(q.id);
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, Jane! 👋</h1>
            <p className="text-muted-foreground text-lg">
              You have {availableQuestions.length - answeredQuestions.length} new questions waiting
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold">Level {userProgress.level}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {userProgress.currentXP} / {getXPForLevel(userProgress.level)} XP
            </p>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {userProgress.level + 1}</span>
            <span className="font-semibold">
              {Math.floor((userProgress.currentXP / getXPForLevel(userProgress.level)) * 100)}%
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
              style={{ width: `${(userProgress.currentXP / getXPForLevel(userProgress.level)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Streak Card */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-[#F59E0B] to-[#F97316] border-0 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{isMobile ? '5' : '7'}-day streak</h2>
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
                 style={{ left: '5%', right: '5%', width: '90%' }} />
            
            {/* Progress Line */}
            <div className="absolute top-[calc(50%+12px)] left-0 h-1 bg-white" 
                 style={{ left: '5%', width: isMobile ? '72%' : '77%' }} />

            {/* Days with Circles */}
            <div className="flex items-center justify-between relative">
              {(isMobile 
                ? [{ day: 'W', completed: true }, { day: 'T', completed: true }, { day: 'F', completed: true }, { day: 'S', completed: true }, { day: 'S', completed: false }]
                : [{ day: 'S', completed: true }, { day: 'M', completed: true }, { day: 'T', completed: true }, { day: 'W', completed: true }, { day: 'T', completed: true }, { day: 'F', completed: true }, { day: 'S', completed: false }]
              ).map((item, index) => (
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="new">
            New ({availableQuestions.length - answeredQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="completed">Completed ({answeredQuestions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card className="p-12 text-center">
              <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">All caught up! 🎉</h3>
              <p className="text-muted-foreground">Check back later for new questions</p>
            </Card>
          ) : (
            filteredQuestions.map((question, index) => (
              <Card
                key={question.id}
                className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer animate-fade-in hover:scale-[1.02] border-2 border-transparent hover:border-primary/20"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleStartQuestion(question)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{question.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {question.timeAgo}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{question.question}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">+{question.xpReward}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground capitalize">
                      {question.type.replace("-", " ")} question
                    </span>
                    <Button size="sm" variant="ghost" className="group">
                      Answer now
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">Trending Questions</h3>
            <p className="text-muted-foreground">Most answered by your team this week</p>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {answeredQuestions.length === 0 ? (
            <Card className="p-12 text-center">
              <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No completed questions yet</h3>
              <p className="text-muted-foreground">Start answering to see your progress here</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {availableQuestions
                .filter((q) => answeredQuestions.includes(q.id))
                .map((question) => (
                  <Card key={question.id} className="p-6 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center">
                        <ThumbsUp className="h-5 w-5 text-success-foreground" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">
                          {question.category}
                        </Badge>
                        <h3 className="font-semibold">{question.question}</h3>
                      </div>
                      <Badge className="bg-success/10 text-success border-0">+{question.xpReward} XP</Badge>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {renderQuestionModal()}
      
      {/* Vote Distribution Modal */}
      {showVoteDistribution && currentQuestion && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setShowVoteDistribution(false);
            const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
            setAnsweredQuestions(newAnsweredQuestions);
            setOpenAnswer("");
            
            const nextQuestion = availableQuestions.find(
              (q) => !newAnsweredQuestions.includes(q.id)
            );
            
            setCurrentQuestion(nextQuestion || null);
          }}
        >
          <Card 
            className="max-w-2xl w-full p-8 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Vote Distribution</h2>
                <p className="text-muted-foreground">See how others answered</p>
              </div>

              <div className="space-y-4">
                {voteDistribution.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.option}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} {item.count === 1 ? 'vote' : 'votes'} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 flex items-center justify-center text-xs font-semibold text-primary-foreground"
                        style={{ width: `${item.percentage}%` }}
                      >
                        {item.percentage > 10 && `${item.percentage.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1" 
                  onClick={() => {
                    setShowVoteDistribution(false);
                    const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
                    setAnsweredQuestions(newAnsweredQuestions);
                    setCurrentQuestion(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    setShowVoteDistribution(false);
                    const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
                    setAnsweredQuestions(newAnsweredQuestions);
                    setOpenAnswer("");
                    
                    const nextQuestion = availableQuestions.find(
                      (q) => !newAnsweredQuestions.includes(q.id)
                    );
                    
                    setCurrentQuestion(nextQuestion || null);
                  }}
                >
                  Continue to Next Question
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Level Up Modal */}
      {showLevelUp && (
        <div 
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLevelUp(false)}
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
                onClick={() => setShowLevelUp(false)}
              >
                Continue
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Homepage;
