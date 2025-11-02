import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, AlertTriangle, Wrench, TrendingDown, TrendingUp, BarChart3, MessageSquare, ThumbsUp, ThumbsDown, Trophy, Lightbulb, CheckCircle2, XCircle, Gauge, Star } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ReactWordcloud from "react-wordcloud";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const getQuestionTypeColor = (type: string) => {
  switch (type) {
    case 'Ideation':
      return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50';
    case 'Yes/No':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50';
    case 'Multiple Choice':
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50';
    case 'Open-ended':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/50';
    case 'Ranking':
      return 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/50';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

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
      const responseRate = (totalResponses / 75) * 100;

      if (questionData.question_type === 'open-ended' || questionData.question_type === 'ideation') {
        // For open-ended and ideation questions, analyze trends
        const displayType = questionData.question_type === 'ideation' ? 'Ideation' : 'Open-ended';
        setRealQuestion({
          id: questionData.id,
          question: questionData.question_text,
          type: displayType,
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
            // Fetch keypoints with likes to weight the analysis
            const { data: keypointsData } = await supabase
              .from('response_keypoints')
              .select('text, likes')
              .eq('question_id', id);
            
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-trends', {
              body: {
                question: questionData.question_text,
                responses: openEndedResponses,
                keypoints: keypointsData || []
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
                questionData.question_type === 'ranking' ? 'Ranking' :
                questionData.question_type === 'ideation' ? 'Ideation' :
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
          <Badge className={getQuestionTypeColor(question.type)}>{question.type}</Badge>
          <span className="text-sm text-muted-foreground">
            {question.totalResponses} responses
          </span>
          <span className={`text-sm flex items-center font-medium ${
            question.responseRate > 85 
              ? 'text-success' 
              : question.responseRate >= 50 
              ? 'text-accent' 
              : 'text-destructive'
          }`}>
            <TrendingUp className="h-4 w-4 mr-1" />
            {question.responseRate.toFixed(1)}% response rate
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

      {/* Trend Analysis for Open-ended and Ideation Questions */}
      {(question.type === "Open-ended" || question.type === "Ideation") && trendAnalysis && (
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
              {trendAnalysis.themes
                ?.filter((theme: any) => 
                  !theme.name.toLowerCase().includes('unclear') && 
                  !theme.name.toLowerCase().includes('inappropriate') &&
                  !theme.name.toLowerCase().includes('not applicable') &&
                  theme.name.trim() !== ''
                )
                .map((theme: any, idx: number) => (
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

          {/* Feasibility Assessment */}
          {trendAnalysis.feasibilityAnalysis && (
            <>
              <Card className="p-6 mb-6 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-2 border-blue-500/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold flex items-center">
                    <Gauge className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
                    Feasibility Assessment
                  </h2>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Realism Score</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {trendAnalysis.feasibilityAnalysis.realismScore}/10
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
              </Card>

              <Card className="p-6 mb-8 bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-2 border-purple-500/20">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold flex items-center">
                    <Lightbulb className="mr-3 h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Actionable Insights
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">Prioritized solutions based on implementation complexity</p>
                </div>

                <div className="space-y-6">
                  {/* Easy Solutions - Horizontal Cards */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-green-700 dark:text-green-400">Quick Wins</h3>
                        <p className="text-xs text-muted-foreground">Ready to implement immediately</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {trendAnalysis.feasibilityAnalysis.easySolutions?.map((item: string, idx: number) => (
                        <div 
                          key={idx} 
                          className="group relative p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all hover:shadow-lg hover:scale-[1.02]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                              {idx + 1}
                            </div>
                            <p className="text-sm font-medium text-foreground leading-relaxed pt-0.5">{item}</p>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Star className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-purple-200 dark:border-purple-800"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-4 text-xs text-muted-foreground uppercase tracking-wide">Requires Planning</span>
                    </div>
                  </div>

                  {/* Challenging Items - Stacked Cards with Progress Indicators */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-amber-700 dark:text-amber-400">Strategic Initiatives</h3>
                        <p className="text-xs text-muted-foreground">Long-term implementation required</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {trendAnalysis.feasibilityAnalysis.challenges?.map((item: string, idx: number) => (
                        <div 
                          key={idx}
                          className="relative pl-12 pr-4 py-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 rounded-xl border-l-4 border-amber-400 dark:border-amber-600 hover:shadow-md transition-all"
                        >
                          <div className="absolute left-3 top-4 h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {idx + 1}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground leading-relaxed">{item}</p>
                            <Badge variant="outline" className="text-xs">
                              {idx === 0 ? 'Medium' : idx === 1 ? 'High' : 'Very High'} Complexity
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Implementation Recommendations */}
          {trendAnalysis.actionableInsights && (
            <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Wrench className="mr-3 h-6 w-6 text-primary" />
                  Implementation Recommendations
                </h2>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Complexity Score</p>
                  <p className="text-4xl font-bold text-primary">
                    {trendAnalysis.actionableInsights.complexityScore}
                  </p>
                  <p className="text-xs text-muted-foreground">out of 200</p>
                </div>
              </div>

              <div className="space-y-4">
                {trendAnalysis.actionableInsights.recommendations?.map((rec: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'high' 
                        ? 'bg-destructive/5 border-destructive' 
                        : rec.priority === 'medium'
                        ? 'bg-accent/5 border-accent'
                        : 'bg-primary/5 border-primary'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                          rec.priority === 'high'
                            ? 'bg-destructive/10 text-destructive'
                            : rec.priority === 'medium'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{rec.action}</h3>
                        <p className="text-sm text-muted-foreground">{rec.justification}</p>
                        <Badge variant="outline" className="mt-2 capitalize">
                          {rec.priority} Priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {analyzingTrends && (question.type === "Open-ended" || question.type === "Ideation") && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Analyzing trends with AI...</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuestionDetail;
