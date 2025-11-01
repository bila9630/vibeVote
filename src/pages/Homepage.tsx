import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, TrendingUp, Clock, ThumbsUp, ThumbsDown, ChevronRight, Trophy, BarChart3, Play, List, Lightbulb, Filter, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { WordCloudResults } from "@/components/WordCloudResults";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { RankingDragDrop } from "@/components/RankingDragDrop";
import { IdeationQuestion } from "@/components/IdeationQuestion";
import { DailyStreakCard } from "@/components/DailyStreakCard";
import { RelativeLeaderboard } from "@/components/RelativeLeaderboard";
import { LevelUpModal } from "@/components/LevelUpModal";
import { ProposeQuestionDialog } from "@/components/ProposeQuestionDialog";
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

const getQuestionTypeColor = (type: QuestionType) => {
  switch (type) {
    case 'ideation':
      return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50';
    case 'yes-no':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50';
    case 'multiple-choice':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50';
    case 'open-ended':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50';
    case 'ranking':
      return 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/50';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getQuestionTypeDisplay = (type: QuestionType) => {
  switch (type) {
    case 'ideation':
      return 'Ideation';
    case 'yes-no':
      return 'Yes/No';
    case 'multiple-choice':
      return 'Multiple Choice';
    case 'open-ended':
      return 'Open-ended';
    case 'ranking':
      return 'Ranking';
    default:
      return type;
  }
};

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
  const [showChallengeSurface, setShowChallengeSurface] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "play">("list");
  const [scrollToQuestionId, setScrollToQuestionId] = useState<string | null>(null);
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Evaluation state
  const [evaluationResult, setEvaluationResult] = useState<{
    xp: number;
    feedback: string;
    questionId: string;
    answer: string;
  } | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const evaluationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [undoTimeLeft, setUndoTimeLeft] = useState(5);
  const evaluationRef = useRef<HTMLDivElement>(null);
  
  // Ranking game state
  const [rankingStarted, setRankingStarted] = useState(false);
  const [showRankingResults, setShowRankingResults] = useState(false);
  const [userRanking, setUserRanking] = useState<string[]>([]);

  // Vote distribution state
  const [showVoteDistribution, setShowVoteDistribution] = useState(false);
  const [voteDistribution, setVoteDistribution] = useState<{ option: string; count: number; percentage: number }[]>([]);
  
  // Word cloud state for open-ended questions
  const [showWordCloud, setShowWordCloud] = useState(false);

  // XP and leveling state
  const [userProgress, setUserProgress] = useState<UserProgress>(loadProgress());
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRewards, setNewRewards] = useState<LevelReward[]>([]);
  
  // Propose question dialog state
  const [showProposeDialog, setShowProposeDialog] = useState(false);
  
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

  // Auto-start first question in Play Mode
  useEffect(() => {
    if (viewMode === "play" && !currentQuestion && !showChallengeSurface) {
      const firstUnanswered = availableQuestions.find(
        (q) => !answeredQuestions.includes(q.id)
      );
      if (firstUnanswered) {
        setCurrentQuestion(firstUnanswered);
      }
    }
  }, [viewMode, currentQuestion, availableQuestions, answeredQuestions, showChallengeSurface]);

  // Scroll to question when switching to list view
  useEffect(() => {
    if (viewMode === "list" && scrollToQuestionId && questionRefs.current[scrollToQuestionId]) {
      setTimeout(() => {
        questionRefs.current[scrollToQuestionId]?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        setScrollToQuestionId(null);
      }, 100);
    }
  }, [viewMode, scrollToQuestionId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    };
  }, []);

  // Focus evaluation when shown (accessibility)
  useEffect(() => {
    if (showEvaluation && evaluationRef.current) {
      evaluationRef.current.focus();
    }
  }, [showEvaluation]);

  const handleStartQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setShowEvaluation(false);
    setEvaluationResult(null);
    setUndoAvailable(false);
  };

  const handleSkipQuestion = () => {
    if (currentQuestion) {
      // Clear any existing timers
      if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      
      // Reset state
      setShowEvaluation(false);
      setEvaluationResult(null);
      setUndoAvailable(false);
      setOpenAnswer("");
      
      // Find next question without marking current as answered
      const nextQuestion = availableQuestions.find(
        (q) => q.id !== currentQuestion.id && !answeredQuestions.includes(q.id)
      );
      
      setCurrentQuestion(nextQuestion || null);
      toast.info("Question skipped", { duration: 2000 });
    }
  };

  const handleUndo = async () => {
    if (!evaluationResult || !currentQuestion) return;
    
    // Clear timers
    if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    
    // Remove from answered questions
    setAnsweredQuestions(prev => prev.filter(id => id !== evaluationResult.questionId));
    
    // Delete the response from database if it was saved
    if (evaluationResult.xp > 0) {
      const { error } = await supabase
        .from('user_responses')
        .delete()
        .eq('question_id', evaluationResult.questionId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error undoing response:', error);
      }
    }
    
    // Reset evaluation state
    setShowEvaluation(false);
    setEvaluationResult(null);
    setUndoAvailable(false);
    
    toast.success("Answer undone", { duration: 2000 });
  };

  const handleCancelNext = () => {
    // Clear timers
    if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    
    // Mark question as answered and close
    if (currentQuestion) {
      setAnsweredQuestions([...answeredQuestions, currentQuestion.id]);
    }
    
    setShowEvaluation(false);
    setEvaluationResult(null);
    setUndoAvailable(false);
    setOpenAnswer("");
    setCurrentQuestion(null);
    
    toast.info("Staying on this screen");
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    
    // Clear timers
    if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    
    // For open-ended questions, show word cloud results before moving to next question
    if (currentQuestion.type === 'open-ended') {
      setShowEvaluation(false);
      setShowWordCloud(true);
      return;
    }
    
    const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
    setAnsweredQuestions(newAnsweredQuestions);
    setShowEvaluation(false);
    setEvaluationResult(null);
    setUndoAvailable(false);
    setOpenAnswer("");
    
    const nextQuestion = availableQuestions.find(
      (q) => !newAnsweredQuestions.includes(q.id)
    );
    
    setCurrentQuestion(nextQuestion || null);
  };

  const handleWordCloudClose = () => {
    if (!currentQuestion) return;
    
    const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
    setAnsweredQuestions(newAnsweredQuestions);
    setShowWordCloud(false);
    setEvaluationResult(null);
    setUndoAvailable(false);
    setOpenAnswer("");
    
    const nextQuestion = availableQuestions.find(
      (q) => !newAnsweredQuestions.includes(q.id)
    );
    
    setCurrentQuestion(nextQuestion || null);
  };

  const handleWordCloudCancel = () => {
    if (!currentQuestion) return;
    
    const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
    setAnsweredQuestions(newAnsweredQuestions);
    setShowWordCloud(false);
    setEvaluationResult(null);
    setUndoAvailable(false);
    setOpenAnswer("");
    
    const nextQuestion = availableQuestions.find(
      (q) => !newAnsweredQuestions.includes(q.id)
    );
    
    setCurrentQuestion(nextQuestion || null);
  };

  const handleExitPlayMode = () => {
    const currentQuestionId = currentQuestion?.id || null;
    setCurrentQuestion(null);
    setViewMode("list");
    if (currentQuestionId) {
      setScrollToQuestionId(currentQuestionId);
    }
    toast.info("Exited Play Mode");
  };

  const handleSwitchToListView = () => {
    const currentQuestionId = currentQuestion?.id || null;
    setCurrentQuestion(null);
    setViewMode("list");
    if (currentQuestionId) {
      setScrollToQuestionId(currentQuestionId);
    }
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
        toast.error('Failed to save answer', { duration: 2000 });
        return;
      }

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
      
      // Set evaluation result
      setEvaluationResult({
        xp: earnedXP,
        feedback: evaluationReason,
        questionId: currentQuestion.id,
        answer: answer
      });
      setShowEvaluation(true);
      setUndoAvailable(true);
      setUndoTimeLeft(5);
      
      // Start undo countdown timer
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      
      let timeLeft = 5;
      undoTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setUndoTimeLeft(timeLeft);
        
        if (timeLeft <= 0) {
          setUndoAvailable(false);
          if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        }
      }, 1000);
      
      // For multiple choice and yes/no, fetch and store vote distribution for later
      if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'yes-no') {
        const { data: responses, error: fetchError } = await supabase
          .from('user_responses')
          .select('selected_option')
          .eq('question_id', currentQuestion.id);

        if (!fetchError && responses) {
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
        }
      }
      
      // Auto-advance removed - user controls when to proceed
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    const answer = direction === "right" ? "Yes" : "No";
    handleAnswer(answer);
  };
  
  const handleRankingComplete = async (ranking: string[]) => {
    if (currentQuestion) {
      // Save ranking to database
      const rankingResult = ranking.map((item, index) => 
        `${index + 1}. ${item}`
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
      
      // Store ranking and show results
      setUserRanking(ranking);
      setShowRankingResults(true);
      setRankingStarted(false);
    }
  };

  const handleRankingResultsClose = () => {
    if (currentQuestion) {
      setAnsweredQuestions([...answeredQuestions, currentQuestion.id]);
      setCurrentQuestion(null);
      setShowRankingResults(false);
      setUserRanking([]);
    }
  };

  const renderQuestionModal = () => {
    if (!currentQuestion || viewMode === "play") return null;
    
    // Show word cloud results for open-ended questions
    if (showWordCloud && currentQuestion.type === 'open-ended') {
      return (
        <WordCloudResults
          questionId={currentQuestion.id}
          question={currentQuestion.question}
          onClose={handleWordCloudClose}
          onCancel={handleWordCloudCancel}
        />
      );
    }

    return (
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => !showEvaluation && setCurrentQuestion(null)}
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

            {/* Render based on type - only show if evaluation not shown */}
            {!showEvaluation && (
              <>
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
                    <div className="relative">
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={openAnswer}
                        onChange={(e) => setOpenAnswer(e.target.value)}
                        className="min-h-[150px] text-base resize-none pr-14"
                      />
                      <div className="absolute bottom-3 right-3">
                        <VoiceRecorder
                          onTranscription={(text) => setOpenAnswer(prev => prev ? `${prev} ${text}` : text)}
                          disabled={false}
                        />
                      </div>
                    </div>
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
                {currentQuestion.type === "ranking" && currentQuestion.rankingOptions && (
                  <RankingDragDrop
                    options={currentQuestion.rankingOptions}
                    onComplete={handleRankingComplete}
                    onCancel={() => setCurrentQuestion(null)}
                    xpReward={currentQuestion.xpReward}
                  />
                )}
                
                {/* Ideation Game */}
                {currentQuestion.type === "ideation" && (
                  <IdeationQuestion
                    questionId={currentQuestion.id}
                    questionText={currentQuestion.question}
                    xpReward={currentQuestion.xpReward}
                    userProgress={userProgress}
                    setUserProgress={setUserProgress}
                    answeredQuestions={answeredQuestions}
                    setAnsweredQuestions={setAnsweredQuestions}
                    onClose={() => setCurrentQuestion(null)}
                    onLevelUp={(rewards) => {
                      setNewRewards(rewards);
                      setShowLevelUp(true);
                    }}
                  />
                )}
              </>
            )}
            
            {/* Inline Evaluation Card */}
            {showEvaluation && evaluationResult && (
              <div
                ref={evaluationRef}
                tabIndex={-1}
                role="status"
                aria-live="polite"
                aria-label="Answer evaluation"
                className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-lg space-y-4 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Star className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-primary">+{evaluationResult.xp} XP</p>
                        <p className="text-sm text-muted-foreground">Earned</p>
                      </div>
                    </div>
                    <p className="text-base text-foreground">{evaluationResult.feedback}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {undoAvailable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUndo}
                      className="gap-2"
                    >
                      <span className="text-sm">↩️</span> Undo ({undoTimeLeft}s)
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCancelNext}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                  >
                    {currentQuestion?.type === 'open-ended' 
                      ? 'View Colleague Suggestions →' 
                      : 'Next Question'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderPlayModeQuestion = () => {
    if (!currentQuestion || viewMode !== "play") return null;
    
    // Show word cloud results for open-ended questions
    if (showWordCloud && currentQuestion.type === 'open-ended') {
      return (
        <WordCloudResults
          questionId={currentQuestion.id}
          question={currentQuestion.question}
          onClose={handleWordCloudClose}
          onCancel={handleWordCloudCancel}
        />
      );
    }

    return (
      <Card className="p-8 shadow-2xl animate-scale-in border-2 border-primary/20">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <Badge className="mb-2">{currentQuestion.category}</Badge>
              <h2 className="text-2xl font-bold leading-tight">{currentQuestion.question}</h2>
            </div>
            {!showEvaluation && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipQuestion}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={showEvaluation}
                >
                  Skip
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitPlayMode}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Exit
                </Button>
              </div>
            )}
          </div>

          {/* Render based on type - only show if evaluation not shown */}
          {!showEvaluation && (
            <>
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
                  <div className="relative">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={openAnswer}
                      onChange={(e) => setOpenAnswer(e.target.value)}
                      className="min-h-[150px] text-base resize-none pr-14"
                    />
                    <div className="absolute bottom-3 right-3">
                      <VoiceRecorder
                        onTranscription={(text) => setOpenAnswer(prev => prev ? `${prev} ${text}` : text)}
                        disabled={false}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleAnswer(openAnswer)}
                    disabled={!openAnswer.trim()}
                  >
                    Submit Answer
                  </Button>
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
                </div>
              )}
              
              {/* Ranking Game */}
              {currentQuestion.type === "ranking" && currentQuestion.rankingOptions && (
                <RankingDragDrop
                  options={currentQuestion.rankingOptions}
                  onComplete={handleRankingComplete}
                  onCancel={handleExitPlayMode}
                  xpReward={currentQuestion.xpReward}
                />
              )}
              
              {/* Ideation Game */}
              {currentQuestion.type === "ideation" && (
                <IdeationQuestion
                  questionId={currentQuestion.id}
                  questionText={currentQuestion.question}
                  xpReward={currentQuestion.xpReward}
                  userProgress={userProgress}
                  setUserProgress={setUserProgress}
                  answeredQuestions={answeredQuestions}
                  setAnsweredQuestions={setAnsweredQuestions}
                  onClose={handleExitPlayMode}
                  onLevelUp={(rewards) => {
                    setNewRewards(rewards);
                    setShowLevelUp(true);
                  }}
                />
              )}
            </>
          )}
          
          {/* Inline Evaluation Card */}
          {showEvaluation && evaluationResult && (
            <div
              ref={evaluationRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              aria-label="Answer evaluation"
              className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-lg space-y-4 animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Star className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-primary">+{evaluationResult.xp} XP</p>
                      <p className="text-sm text-muted-foreground">Earned</p>
                    </div>
                  </div>
                  <p className="text-base text-foreground">{evaluationResult.feedback}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {undoAvailable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    className="gap-2"
                  >
                    <span className="text-sm">↩️</span> Undo ({undoTimeLeft}s)
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleCancelNext}
                >
                  Cancel
                </Button>
                 <Button
                   onClick={handleNext}
                   className="flex-1"
                 >
                   {currentQuestion?.type === 'open-ended' 
                     ? 'View Colleague Suggestions →' 
                     : 'Next Question'}
                 </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(availableQuestions.map(q => q.category)));
  
  const filteredQuestions = availableQuestions.filter((q) => {
    // Tab filter
    let tabMatch = true;
    if (activeTab === "new") tabMatch = !answeredQuestions.includes(q.id);
    if (activeTab === "completed") tabMatch = answeredQuestions.includes(q.id);
    
    // Type filter
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(q.type);
    
    // Category filter
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(q.category);
    
    return tabMatch && typeMatch && categoryMatch;
  });
  
  const hasActiveFilters = selectedTypes.length > 0 || selectedCategories.length > 0;
  
  const handleResetFilters = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    toast.success("Filters reset", { duration: 2000 });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
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

      {/* Daily Streak and Leaderboard Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <DailyStreakCard isMobile={isMobile} />
        <RelativeLeaderboard isMobile={isMobile} />
      </div>

      {/* Challenge Surface */}
      {showChallengeSurface ? (
        <Card className="p-12 text-center space-y-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 animate-fade-in">
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto">
              <Star className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold">Ready for today's questions?</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Complete your {availableQuestions.length - answeredQuestions.length} daily questions to earn XP and track your progress.
            </p>
          </div>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={() => setShowChallengeSurface(false)}
          >
            Start Questions
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>
      ) : (
        <>
          {/* View Mode and Tabs Toggle */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="new">
                    New ({availableQuestions.length - answeredQuestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">Completed ({answeredQuestions.length})</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Filters - Only show in list view */}
              {viewMode === "list" && (
                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedTypes.length + selectedCategories.length}
                        </Badge>
                      )}
                      <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>
            
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={handleSwitchToListView}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
              <Button
                variant={viewMode === "play" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("new");
                  setViewMode("play");
                  if (!currentQuestion) {
                    const firstUnanswered = availableQuestions.find(
                      (q) => !answeredQuestions.includes(q.id)
                    );
                    if (firstUnanswered) {
                      setCurrentQuestion(firstUnanswered);
                    }
                  }
                }}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Play
              </Button>
            </div>
          </div>

          {/* Filters Content - Only show in list view */}
          {viewMode === "list" && (
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleContent>
                <Card className="mb-6 border-2">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="gap-2"
                        disabled={!hasActiveFilters}
                      >
                        <X className="h-4 w-4" />
                        Reset Filters
                      </Button>
                    </div>

                    {/* Question Type Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Question Type</label>
                      <ToggleGroup 
                        type="multiple" 
                        value={selectedTypes}
                        onValueChange={(value) => setSelectedTypes(value as QuestionType[])}
                        className="justify-start flex-wrap"
                      >
                        <ToggleGroupItem value="ideation" className="gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Ideation
                        </ToggleGroupItem>
                        <ToggleGroupItem value="yes-no" className="gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          Yes/No
                        </ToggleGroupItem>
                        <ToggleGroupItem value="multiple-choice" className="gap-2">
                          <List className="h-4 w-4" />
                          Multiple Choice
                        </ToggleGroupItem>
                        <ToggleGroupItem value="open-ended" className="gap-2">
                          <Star className="h-4 w-4" />
                          Open-ended
                        </ToggleGroupItem>
                        <ToggleGroupItem value="ranking" className="gap-2">
                          <Trophy className="h-4 w-4" />
                          Ranking
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    {/* Category Filter */}
                    {uniqueCategories.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Topic</label>
                        <ToggleGroup 
                          type="multiple" 
                          value={selectedCategories}
                          onValueChange={setSelectedCategories}
                          className="justify-start flex-wrap"
                        >
                          {uniqueCategories.map((category) => (
                            <ToggleGroupItem key={category} value={category}>
                              {category}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                    )}
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Tabs Content */}
          <Tabs value={activeTab} className="space-y-6">

            <TabsContent value="new" className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <Card className="p-12 text-center">
                  <Filter className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">
                    {hasActiveFilters ? "No questions match your filters" : "All caught up! 🎉"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters to see more questions" 
                      : "Check back later for new questions"}
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={handleResetFilters} className="gap-2">
                      <X className="h-4 w-4" />
                      Reset Filters
                    </Button>
                  )}
                </Card>
              ) : viewMode === "list" ? (
                filteredQuestions.map((question, index) => (
                  <Card
                    key={question.id}
                    ref={(el) => {
                      questionRefs.current[question.id] = el;
                    }}
                    className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer animate-fade-in hover:scale-[1.02] border-2 border-transparent hover:border-primary/20"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleStartQuestion(question)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getQuestionTypeColor(question.type)}>{getQuestionTypeDisplay(question.type)}</Badge>
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
                        <Button size="sm" variant="ghost" className="group">
                          Answer now
                          <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                renderPlayModeQuestion() || (
                  <Card className="p-12 text-center space-y-4 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
                    <Play className="h-16 w-16 mx-auto text-primary" />
                    <h3 className="text-2xl font-bold">Play Mode Active</h3>
                    <p className="text-muted-foreground">
                      All questions completed! 🎉
                    </p>
                  </Card>
                )
              )}
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
        </>
      )}

      {renderQuestionModal()}
      
      {/* Word Cloud Modal for Open-Ended Questions */}
      {showWordCloud && currentQuestion && (
        <WordCloudResults
          questionId={currentQuestion.id}
          question={currentQuestion.question}
          onClose={() => {
            setShowWordCloud(false);
            const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
            setAnsweredQuestions(newAnsweredQuestions);
            setOpenAnswer("");
            
            const nextQuestion = availableQuestions.find(
              (q) => !newAnsweredQuestions.includes(q.id)
            );
            
            setCurrentQuestion(nextQuestion || null);
          }}
          onCancel={() => {
            setShowWordCloud(false);
            setCurrentQuestion(null);
          }}
        />
      )}
      
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
      
      {/* Ranking Results Modal */}
      {showRankingResults && currentQuestion && userRanking.length > 0 && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={handleRankingResultsClose}
        >
          <Card 
            className="max-w-3xl w-full p-8 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto border-2 border-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Trophy className="h-20 w-20 text-primary animate-pulse" />
                  <span className="absolute -top-2 -right-2 text-3xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Rankings Are In! 🏆
                </h2>
                <p className="text-muted-foreground">See how you compare with your colleagues</p>
              </div>

              {/* Your Ranking */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⭐</span>
                  <h3 className="text-xl font-bold text-primary">Your Top Picks</h3>
                </div>
                <div className="space-y-2">
                  {userRanking.slice(0, 3).map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border-2 border-primary/30 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </div>
                      <span className="font-semibold text-lg">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colleague 1 Ranking */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">👩‍💼</span>
                  <h3 className="text-lg font-bold">Sarah's Top Picks</h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    // Mock ranking - shuffle the items
                    const shuffled = [...userRanking].sort(() => Math.random() - 0.5);
                    return shuffled.slice(0, 3).map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 bg-background/80 rounded-lg hover:bg-background transition-colors"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center font-bold border-2 border-blue-500/30">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>
                        <span className="font-medium">{item}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Colleague 2 Ranking */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">👨‍💼</span>
                  <h3 className="text-lg font-bold">Michael's Top Picks</h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    // Mock ranking - shuffle differently
                    const shuffled = [...userRanking].sort(() => 0.5 - Math.random());
                    return shuffled.slice(0, 3).map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 bg-background/80 rounded-lg hover:bg-background transition-colors"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center font-bold border-2 border-purple-500/30">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>
                        <span className="font-medium">{item}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <Button 
                size="lg"
                className="w-full text-lg shadow-lg hover:shadow-xl transition-all" 
                onClick={handleRankingResultsClose}
              >
                Continue 🚀
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Level Up Modal */}
      <LevelUpModal
        show={showLevelUp}
        userProgress={userProgress}
        newRewards={newRewards}
        onClose={() => setShowLevelUp(false)}
      />

      {/* Propose Question FAB */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-2xl hover:shadow-accent/50 bg-gradient-to-br from-primary to-secondary hover:scale-110 transition-all z-40"
        onClick={() => setShowProposeDialog(true)}
        title="Propose a new question"
      >
        <Lightbulb className="h-6 w-6 text-primary-foreground" />
      </Button>

      {/* Propose Question Dialog */}
      <ProposeQuestionDialog
        open={showProposeDialog}
        onOpenChange={setShowProposeDialog}
      />
      </div>
      </div>
    </div>
  );
};

export default Homepage;
