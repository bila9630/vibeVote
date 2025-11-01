import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, AlertTriangle, Sparkles, Wrench, Target, TrendingDown, TrendingUp, BarChart3, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
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
    wordCloud: {
      positive: [
        { text: "flexible", value: 45 },
        { text: "balanced", value: 38 },
        { text: "satisfied", value: 35 },
        { text: "healthy", value: 28 },
        { text: "time", value: 25 },
        { text: "family", value: 22 },
        { text: "manageable", value: 20 },
        { text: "freedom", value: 18 },
        { text: "control", value: 15 },
        { text: "happy", value: 14 },
      ],
      negative: [
        { text: "overwhelming", value: 35 },
        { text: "stressed", value: 30 },
        { text: "burnout", value: 25 },
        { text: "exhausted", value: 22 },
        { text: "demanding", value: 20 },
        { text: "imbalanced", value: 18 },
        { text: "difficult", value: 15 },
        { text: "pressure", value: 12 },
      ],
    },
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
    wordCloud: {
      positive: [
        { text: "opportunities", value: 48 },
        { text: "growth", value: 42 },
        { text: "mentorship", value: 38 },
        { text: "learning", value: 35 },
        { text: "training", value: 32 },
        { text: "advancement", value: 28 },
        { text: "support", value: 25 },
        { text: "development", value: 22 },
        { text: "skills", value: 20 },
        { text: "resources", value: 18 },
      ],
      negative: [
        { text: "limited", value: 30 },
        { text: "stagnant", value: 25 },
        { text: "unclear", value: 22 },
        { text: "lacking", value: 20 },
        { text: "insufficient", value: 18 },
        { text: "plateaued", value: 15 },
        { text: "frustrated", value: 12 },
      ],
    },
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
];

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const question = questionsData.find((q) => q.id === Number(id));

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
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
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
