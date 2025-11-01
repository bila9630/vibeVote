import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Star, TrendingUp, Clock, ThumbsUp, ThumbsDown, ChevronRight, Flame } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type QuestionType = "multiple-choice" | "open-ended" | "yes-no";

interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  category: string;
  xpReward: number;
  timeAgo: string;
}

const availableQuestions: Question[] = [
  {
    id: 1,
    type: "multiple-choice",
    question: "How would you rate your work-life balance this week?",
    options: ["Excellent", "Good", "Fair", "Needs Improvement"],
    category: "Wellness",
    xpReward: 50,
    timeAgo: "2h ago",
  },
  {
    id: 2,
    type: "yes-no",
    question: "Do you feel your contributions are valued by the team?",
    category: "Team Culture",
    xpReward: 50,
    timeAgo: "5h ago",
  },
  {
    id: 3,
    type: "open-ended",
    question: "What's one thing we could improve to make your work experience better?",
    category: "Feedback",
    xpReward: 75,
    timeAgo: "1d ago",
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "How clear are your current project goals?",
    options: ["Very Clear", "Mostly Clear", "Somewhat Clear", "Not Clear"],
    category: "Projects",
    xpReward: 50,
    timeAgo: "1d ago",
  },
  {
    id: 5,
    type: "yes-no",
    question: "Would you recommend our company as a great place to work?",
    category: "Culture",
    xpReward: 50,
    timeAgo: "2d ago",
  },
];

const Homepage = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("new");
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");

  const handleStartQuestion = (question: Question) => {
    setCurrentQuestion(question);
  };

  const handleAnswer = (answer: string) => {
    if (currentQuestion) {
      toast.success(`+${currentQuestion.xpReward} XP!`, {
        description: "Answer submitted successfully!",
        icon: <Star className="h-4 w-4 text-accent" />,
      });
      
      const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
      setAnsweredQuestions(newAnsweredQuestions);
      setOpenAnswer("");
      
      // Find the next unanswered question
      const nextQuestion = availableQuestions.find(
        (q) => !newAnsweredQuestions.includes(q.id)
      );
      
      // Automatically open the next question or close the modal
      setCurrentQuestion(nextQuestion || null);
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    const answer = direction === "right" ? "Yes" : "No";
    handleAnswer(answer);
  };

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
        <h1 className="text-4xl font-bold mb-2">Welcome back, Jane! 👋</h1>
        <p className="text-muted-foreground text-lg">
          You have {availableQuestions.length - answeredQuestions.length} new questions waiting
        </p>
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
    </div>
  );
};

export default Homepage;
