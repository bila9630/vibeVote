import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, AlertTriangle, Sparkles, Wrench, Target, TrendingDown, TrendingUp, BarChart3, MessageSquare, ThumbsUp, ThumbsDown, Trophy } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ReactWordcloud from "react-wordcloud";

// This would typically come from a shared data file or API
const questionsData = [
  {
    id: 1,
    question: "How satisfied are you with your current work-life balance?",
    type: "Multiple Choice",
    totalResponses: 324,
    responseRate: 89,
    responses: [
      { name: "Very Satisfied", value: 142, fill: "hsl(var(--success))" },
      { name: "Satisfied", value: 98, fill: "hsl(var(--primary))" },
      { name: "Neutral", value: 56, fill: "hsl(var(--accent))" },
      { name: "Dissatisfied", value: 28, fill: "hsl(var(--destructive))" },
    ],
    keyObservations: [
      { icon: Heart, text: "74% of employees report positive work-life balance satisfaction" },
      { icon: AlertTriangle, text: "8.6% are dissatisfied, indicating potential burnout risk" },
    ],
    actionableInsights: [
      { icon: Sparkles, text: "Implement flexible working hours for better balance" },
      { icon: Target, text: "Focus on supporting the dissatisfied group with wellness programs" },
    ],
  },
  {
    id: 2,
    question: "Do you feel supported by your team lead?",
    type: "Yes/No",
    totalResponses: 356,
    responseRate: 98,
    responses: [
      { name: "Yes", value: 312, fill: "hsl(var(--success))" },
      { name: "No", value: 44, fill: "hsl(var(--destructive))" },
    ],
    keyObservations: [
      { icon: Heart, text: "87.6% feel supported by their team lead" },
      { icon: TrendingDown, text: "12.4% lack adequate leadership support" },
    ],
    actionableInsights: [
      { icon: Wrench, text: "Provide leadership training for team leads" },
      { icon: Target, text: "Conduct one-on-one sessions with unsupported employees" },
    ],
  },
  {
    id: 3,
    question: "What improvements would you suggest for our remote work policy?",
    type: "Open-ended",
    totalResponses: 287,
    responseRate: 79,
    sentiment: {
      positive: 198,
      neutral: 67,
      negative: 22,
    },
    recentFeedback: [
      { text: "More flexibility with working hours would be great!", sentiment: "positive", time: "2h ago" },
      { text: "Better communication tools needed for remote collaboration.", sentiment: "neutral", time: "5h ago" },
      { text: "The current policy is working well for me.", sentiment: "positive", time: "1d ago" },
    ],
    wordCloud: {
      positive: [
        { text: "flexible", value: 50 },
        { text: "freedom", value: 42 },
        { text: "autonomy", value: 38 },
        { text: "convenient", value: 35 },
        { text: "productive", value: 32 },
        { text: "comfortable", value: 28 },
        { text: "efficient", value: 25 },
        { text: "balance", value: 22 },
        { text: "trust", value: 20 },
        { text: "support", value: 18 },
      ],
      negative: [
        { text: "isolated", value: 28 },
        { text: "disconnected", value: 25 },
        { text: "communication", value: 22 },
        { text: "unclear", value: 18 },
        { text: "challenging", value: 15 },
        { text: "lonely", value: 12 },
        { text: "confusing", value: 10 },
      ],
    },
    keyObservations: [
      { icon: Heart, text: "69% positive sentiment shows overall satisfaction with policy" },
      { icon: AlertTriangle, text: "Common requests include more flexibility and better collaboration tools" },
    ],
    actionableInsights: [
      { icon: Sparkles, text: "Introduce flexible working hours across all teams" },
      { icon: Wrench, text: "Invest in improved communication and collaboration platforms" },
    ],
  },
  {
    id: 4,
    question: "Rate your satisfaction with career development opportunities",
    type: "Multiple Choice",
    totalResponses: 298,
    responseRate: 82,
    responses: [
      { name: "Excellent", value: 89, fill: "hsl(var(--success))" },
      { name: "Good", value: 125, fill: "hsl(var(--primary))" },
      { name: "Average", value: 58, fill: "hsl(var(--accent))" },
      { name: "Poor", value: 26, fill: "hsl(var(--destructive))" },
    ],
    keyObservations: [
      { icon: Heart, text: "71.8% rate career development opportunities positively" },
      { icon: AlertTriangle, text: "28.2% rate as average or poor, signaling need for improvement" },
    ],
    actionableInsights: [
      { icon: Target, text: "Expand mentorship and training programs" },
      { icon: Sparkles, text: "Create clear career progression pathways" },
    ],
  },
  {
    id: 5,
    question: "Are you satisfied with the company's communication channels?",
    type: "Yes/No",
    totalResponses: 341,
    responseRate: 94,
    responses: [
      { name: "Yes", value: 289, fill: "hsl(var(--success))" },
      { name: "No", value: 52, fill: "hsl(var(--destructive))" },
    ],
    keyObservations: [
      { icon: Heart, text: "84.8% are satisfied with current communication channels" },
      { icon: AlertTriangle, text: "15.2% indicate communication gaps need addressing" },
    ],
    actionableInsights: [
      { icon: Wrench, text: "Survey dissatisfied users for specific channel improvements" },
      { icon: Target, text: "Implement additional communication tools for better reach" },
    ],
  },
  {
    id: 6,
    question: "What's your favorite food in the canteen?",
    type: "Ranking",
    totalResponses: 276,
    responseRate: 76,
    options: [
      { name: "Croissants 🥐", emoji: "🥐", wins: 0 },
      { name: "Muffins 🧁", emoji: "🧁", wins: 0 },
      { name: "Cookies 🍪", emoji: "🍪", wins: 0 },
      { name: "Macarons 🍬", emoji: "🍬", wins: 0 },
      { name: "Donuts 🍩", emoji: "🍩", wins: 0 },
    ],
    finalRanking: [
      { name: "Donuts 🍩", wins: 142, fill: "hsl(var(--success))" },
      { name: "Cookies 🍪", wins: 98, fill: "hsl(var(--primary))" },
      { name: "Macarons 🍬", wins: 73, fill: "hsl(var(--accent))" },
      { name: "Croissants 🥐", wins: 45, fill: "hsl(var(--muted))" },
      { name: "Muffins 🧁", wins: 28, fill: "hsl(var(--muted-foreground))" },
    ],
    keyObservations: [
      { icon: Trophy, text: "Donuts emerged as the clear favorite with 51.4% preference" },
      { icon: TrendingUp, text: "Sweet items (donuts, cookies) preferred over flaky pastries" },
    ],
    actionableInsights: [
      { icon: Sparkles, text: "Expand donut variety and ensure daily availability" },
      { icon: Target, text: "Consider introducing more sweet comfort food options" },
    ],
  },
];

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const question = questionsData.find((q) => q.id === Number(id));
  
  // State for ranking game
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [remainingOptions, setRemainingOptions] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState<any[]>([]);
  const [winner, setWinner] = useState<any>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [userRanking, setUserRanking] = useState<any[]>([]);
  
  const startRankingGame = () => {
    if (question?.options) {
      const shuffled = [...question.options].sort(() => Math.random() - 0.5);
      setRemainingOptions(shuffled);
      setCurrentPair([shuffled[0], shuffled[1]]);
      setGameStarted(true);
      setCurrentRound(1);
      setGameComplete(false);
      setUserRanking([]);
    }
  };
  
  const handleChoice = (chosen: any, notChosen: any) => {
    const updatedRanking = [...userRanking];
    const chosenIndex = updatedRanking.findIndex(item => item.name === chosen.name);
    
    if (chosenIndex === -1) {
      updatedRanking.push({ ...chosen, wins: 1 });
    } else {
      updatedRanking[chosenIndex].wins += 1;
    }
    
    setUserRanking(updatedRanking);
    
    // Get next challenger
    const currentIndex = remainingOptions.findIndex(opt => opt.name === notChosen.name);
    const nextIndex = (currentIndex + 2) % remainingOptions.length;
    
    if (currentRound >= 10) {
      // Game complete after 10 rounds
      setWinner(chosen);
      setGameComplete(true);
    } else {
      setCurrentPair([chosen, remainingOptions[nextIndex]]);
      setCurrentRound(currentRound + 1);
    }
  };

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate("/analytics")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analytics
        </Button>
        <p className="text-muted-foreground">Question not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/analytics")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Analytics
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">{question.question}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline">{question.type}</Badge>
          <span className="text-sm text-muted-foreground">
            {question.totalResponses} responses
          </span>
          <span className="text-sm text-success flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            {question.responseRate}% response rate
          </span>
        </div>
      </div>

      {/* Word Cloud Section */}
      {question.wordCloud && (
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2">Feedback Word Analysis</h2>
          <p className="text-muted-foreground mb-6">Most common words used in positive and negative feedback</p>
          
          <Tabs defaultValue="positive" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="positive">Positive Feedback</TabsTrigger>
              <TabsTrigger value="negative">Negative Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="positive" className="mt-0">
              <div className="h-[400px] flex items-center justify-center">
                <ReactWordcloud
                  words={question.wordCloud.positive}
                  options={{
                    rotations: 2,
                    rotationAngles: [0, 0],
                    fontSizes: [16, 60],
                    colors: ["hsl(var(--success))"],
                    enableTooltip: true,
                    deterministic: true,
                    fontFamily: "inherit",
                    padding: 2,
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="negative" className="mt-0">
              <div className="h-[400px] flex items-center justify-center">
                <ReactWordcloud
                  words={question.wordCloud.negative}
                  options={{
                    rotations: 2,
                    rotationAngles: [0, 0],
                    fontSizes: [16, 60],
                    colors: ["hsl(var(--destructive))"],
                    enableTooltip: true,
                    deterministic: true,
                    fontFamily: "inherit",
                    padding: 2,
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Analytics Content */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Chart Section for Multiple Choice and Yes/No */}
        {(question.type === "Multiple Choice" || question.type === "Yes/No") && (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Response Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={question.responses}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {question.responses?.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Response Breakdown</h2>
              <div className="space-y-3">
                {question.responses?.map((response, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: response.fill }}
                      />
                      <span className="font-medium">{response.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg">{response.value}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({((response.value / question.totalResponses) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Ranking Game */}
        {question.type === "Ranking" && !gameStarted && (
          <Card className="p-8 lg:col-span-2">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-3">Pairwise Ranking Game</h2>
              <p className="text-muted-foreground mb-6">
                Compare your preferences two at a time. Choose your favorite in each round, and we'll determine your ultimate pick!
              </p>
              <Button size="lg" onClick={startRankingGame}>
                Start Ranking Game
              </Button>
            </div>
          </Card>
        )}
        
        {question.type === "Ranking" && gameStarted && !gameComplete && (
          <Card className="p-8 lg:col-span-2">
            <div className="text-center mb-6">
              <Badge variant="outline" className="mb-4">Round {currentRound} of 10</Badge>
              <h2 className="text-2xl font-semibold mb-2">Which do you prefer?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {currentPair.map((option, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-32 text-4xl hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
                  onClick={() => handleChoice(option, currentPair[1 - idx])}
                >
                  {option.emoji}
                  <span className="ml-3 text-lg">{option.name.replace(option.emoji, '').trim()}</span>
                </Button>
              ))}
            </div>
          </Card>
        )}
        
        {question.type === "Ranking" && gameComplete && (
          <Card className="p-8 lg:col-span-2">
            <div className="text-center mb-6">
              <Trophy className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-3xl font-semibold mb-2">Your Ultimate Pick: {winner?.name}</h2>
              <p className="text-muted-foreground">
                Your taste profile: Sweet over flaky, comfort over elegance
              </p>
            </div>
            <div className="max-w-2xl mx-auto space-y-3 mb-6">
              <h3 className="text-xl font-semibold mb-4">Your Personal Ranking:</h3>
              {userRanking
                .sort((a, b) => b.wins - a.wins)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {idx + 1}
                      </div>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-medium">{item.name.replace(item.emoji, '').trim()}</span>
                    </div>
                    <span className="text-muted-foreground">{item.wins} wins</span>
                  </div>
                ))}
            </div>
            <div className="text-center">
              <Button onClick={startRankingGame}>Play Again</Button>
            </div>
          </Card>
        )}
        
        {question.type === "Ranking" && !gameStarted && question.finalRanking && (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-primary" />
                Overall Ranking
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={question.finalRanking} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="wins" radius={[0, 8, 8, 0]}>
                    {question.finalRanking.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Preference Breakdown</h2>
              <div className="space-y-3">
                {question.finalRanking.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {idx + 1}
                      </div>
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg">{item.wins}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({((item.wins / question.totalResponses) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Sentiment Analysis for Open-ended */}
        {question.type === "Open-ended" && question.sentiment && (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                Sentiment Analysis
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Positive", value: question.sentiment.positive, fill: "hsl(var(--success))" },
                  { name: "Neutral", value: question.sentiment.neutral, fill: "hsl(var(--accent))" },
                  { name: "Negative", value: question.sentiment.negative, fill: "hsl(var(--destructive))" },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="value" fill="fill" radius={[8, 8, 0, 0]}>
                    {[
                      { fill: "hsl(var(--success))" },
                      { fill: "hsl(var(--accent))" },
                      { fill: "hsl(var(--destructive))" },
                    ].map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
              <div className="space-y-3">
                {question.recentFeedback?.map((feedback, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <p className="mb-2 text-sm">{feedback.text}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge 
                        variant={feedback.sentiment === "positive" ? "default" : "outline"}
                        className={
                          feedback.sentiment === "positive" 
                            ? "bg-success/10 text-success hover:bg-success/20" 
                            : "bg-accent/10 text-accent"
                        }
                      >
                        {feedback.sentiment === "positive" ? (
                          <ThumbsUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ThumbsDown className="h-3 w-3 mr-1" />
                        )}
                        {feedback.sentiment}
                      </Badge>
                      <span>{feedback.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Key Observations and Actionable Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Key Observations */}
        <Card className="bg-primary/5 border-primary/20">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Target className="mr-3 h-6 w-6 text-primary" />
              Key Observations
            </h2>
            <div className="space-y-4">
              {question.keyObservations?.map((observation, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-background/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {idx + 1}
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <observation.icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                    <p className="text-base leading-relaxed">{observation.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Actionable Insights */}
        <Card className="bg-success/5 border-success/20">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Sparkles className="mr-3 h-6 w-6 text-success" />
              Actionable Insights
            </h2>
            <div className="space-y-4">
              {question.actionableInsights?.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-background/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success font-semibold text-lg">
                    {idx + 1}
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <insight.icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-success" />
                    <p className="text-base leading-relaxed">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuestionDetail;
