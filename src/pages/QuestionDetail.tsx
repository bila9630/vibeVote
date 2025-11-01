import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, AlertTriangle, Sparkles, Wrench, Target, TrendingDown, TrendingUp, BarChart3, MessageSquare, ThumbsUp, ThumbsDown, Trophy, Lightbulb, CheckCircle2, XCircle, Gauge } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ReactWordcloud from "react-wordcloud";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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
  const [realQuestion, setRealQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trendAnalysis, setTrendAnalysis] = useState<any>(null);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);

  useEffect(() => {
    const loadQuestionDetail = async () => {
      // Try to fetch real question from database
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (questionError) {
        console.error('Error loading question:', questionError);
        setLoading(false);
        return;
      }

      // Fetch all responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('user_responses')
        .select('*')
        .eq('question_id', id);

      if (responsesError) {
        console.error('Error loading responses:', responsesError);
        setLoading(false);
        return;
      }

      const totalResponses = responsesData.length;
      const responseRate = totalResponses > 0 ? 100 : 0;

      if (questionData.question_type === 'open-ended') {
        // For open-ended questions, analyze trends
        setRealQuestion({
          id: questionData.id,
          question: questionData.question_text,
          type: 'Open-ended',
          totalResponses,
          responseRate,
          responses: [],
        });
        
        if (totalResponses > 0) {
          setAnalyzingTrends(true);
          const openEndedResponses = responsesData
            .filter(r => r.response_text)
            .map(r => r.response_text);
          
          try {
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-trends', {
              body: {
                question: questionData.question_text,
                responses: openEndedResponses
              }
            });
            
            if (!analysisError && analysisData) {
              setTrendAnalysis(analysisData);
            }
          } catch (error) {
            console.error('Error analyzing trends:', error);
          } finally {
            setAnalyzingTrends(false);
          }
        }
      } else {
        // For multiple choice / yes-no questions
        // For yes-no questions, use hardcoded options if not in database
        let options: string[] = [];
        if (questionData.question_type === 'yes-no') {
          options = ['Yes', 'No'];
        } else {
          options = (questionData.options as any)?.options || [];
        }
        
        const responseCounts: { [key: string]: number } = {};
        
        options.forEach((opt: string) => {
          responseCounts[opt] = 0;
        });

        responsesData.forEach((response) => {
          const option = response.selected_option;
          if (option && responseCounts.hasOwnProperty(option)) {
            responseCounts[option]++;
          }
        });

        const chartData = options.map((opt: string, idx: number) => ({
          name: opt,
          value: responseCounts[opt],
          fill: idx === 0 ? "hsl(var(--success))" : 
                idx === 1 ? "hsl(var(--destructive))" : 
                idx === 2 ? "hsl(var(--accent))" : 
                "hsl(var(--primary))"
        }));

        setRealQuestion({
          id: questionData.id,
          question: questionData.question_text,
          type: questionData.question_type === 'multiple-choice' ? 'Multiple Choice' : 
                questionData.question_type === 'yes-no' ? 'Yes/No' : 
                'Open-ended',
          totalResponses,
          responseRate,
          responses: chartData,
        });
      }
      
      setLoading(false);
    };

    loadQuestionDetail();
  }, [id]);

  // Use real question if loaded, otherwise fall back to mock data
  const question = realQuestion || questionsData.find((q) => q.id === Number(id));

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
          <p className="text-muted-foreground mb-6">Most common words used in feedback responses</p>
          
          <div className="h-[400px] flex items-center justify-center">
            <ReactWordcloud
              words={[...question.wordCloud.positive, ...question.wordCloud.negative]
                .sort((a, b) => b.value - a.value)
                .slice(0, 12)}
              options={{
                rotations: 2,
                rotationAngles: [0, 0],
                fontSizes: [20, 64],
                colors: ["hsl(var(--primary))"],
                enableTooltip: true,
                deterministic: true,
                fontFamily: "inherit",
                padding: 4,
              }}
            />
          </div>
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

        {/* Ranking Results */}
        {question.type === "Ranking" && question.finalRanking && (
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

      </div>

      {/* Trend Analysis for Open-ended Questions */}
      {question.type === "Open-ended" && trendAnalysis && (
        <>
          <Card className="p-6 mb-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-3 h-6 w-6 text-purple-600 dark:text-purple-400" />
              Underlying Trends Analysis
            </h2>
            <p className="text-lg mb-6 font-medium text-purple-900 dark:text-purple-100">
              {trendAnalysis.dominantTrend}
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {trendAnalysis.themes?.map((theme: any, idx: number) => (
                <div key={idx} className="p-4 bg-background/80 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{theme.name}</h3>
                    <Badge variant="outline" className="text-lg font-bold">
                      {theme.percentage}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                  {theme.examples && theme.examples.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                      {theme.examples.slice(0, 2).map((example: string, exIdx: number) => (
                        <p key={exIdx} className="text-xs italic pl-3 border-l-2 border-primary/30">
                          "{example}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Feasibility Analysis */}
          {trendAnalysis.feasibilityAnalysis && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Gauge className="mr-3 h-6 w-6 text-primary" />
                  Feasibility Assessment
                </h2>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Realism Score</p>
                  <p className="text-4xl font-bold text-primary">
                    {trendAnalysis.feasibilityAnalysis.realismScore}/10
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Pros */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center text-success">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Pros
                  </h3>
                  <div className="space-y-2">
                    {trendAnalysis.feasibilityAnalysis.pros?.map((pro: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-success/5 rounded-lg border border-success/20">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{pro}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cons */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center text-destructive">
                    <XCircle className="h-5 w-5 mr-2" />
                    Challenges
                  </h3>
                  <div className="space-y-2">
                    {trendAnalysis.feasibilityAnalysis.cons?.map((con: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{con}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Easy Solutions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                    Easily Solvable
                  </h3>
                  <div className="space-y-2">
                    {trendAnalysis.feasibilityAnalysis.easySolutions?.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm pt-0.5">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenging Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-accent" />
                    More Challenging
                  </h3>
                  <div className="space-y-2">
                    {trendAnalysis.feasibilityAnalysis.challenges?.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-accent/5 rounded-lg">
                        <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs flex-shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm pt-0.5">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {analyzingTrends && question.type === "Open-ended" && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Analyzing trends with AI...</p>
          </div>
        </Card>
      )}

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
