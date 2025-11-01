import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, ArrowRight, Trophy } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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
    finalRanking: [
      { name: "Donuts 🍩", wins: 142, fill: "hsl(var(--success))" },
      { name: "Cookies 🍪", wins: 98, fill: "hsl(var(--primary))" },
      { name: "Macarons 🍬", wins: 73, fill: "hsl(var(--accent))" },
      { name: "Croissants 🥐", wins: 45, fill: "hsl(var(--muted))" },
      { name: "Muffins 🧁", wins: 28, fill: "hsl(var(--muted-foreground))" },
    ],
  },
];

const Analytics = () => {
  const navigate = useNavigate();
  const [realQuestions, setRealQuestions] = useState<any[]>([]);

  useEffect(() => {
    const loadRealQuestions = async () => {
      // Fetch all questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        return;
      }

      // Fetch all responses
      const { data: allResponses, error: responsesError } = await supabase
        .from('user_responses')
        .select('*');

      if (responsesError) {
        console.error('Error loading responses:', responsesError);
        return;
      }

      // Process each question
      const processedQuestions = questionsData.map((questionData) => {
        const responsesForQuestion = allResponses.filter(
          (r) => r.question_id === questionData.id
        );

        const totalResponses = responsesForQuestion.length;
        const responseRate = totalResponses > 0 ? 100 : 0;

        // Format type
        const type = questionData.question_type === 'multiple-choice' ? 'Multiple Choice' : 
                     questionData.question_type === 'yes-no' ? 'Yes/No' : 
                     questionData.question_type === 'open-ended' ? 'Open-ended' :
                     questionData.question_type === 'ranking' ? 'Ranking' : 'Ideation';

        // For multiple-choice and yes-no questions, aggregate responses
        let chartData = [];
        if (questionData.question_type === 'multiple-choice' || questionData.question_type === 'yes-no') {
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

          responsesForQuestion.forEach((response) => {
            const option = response.selected_option;
            if (option && responseCounts.hasOwnProperty(option)) {
              responseCounts[option]++;
            }
          });

          chartData = options.map((opt: string, idx: number) => ({
            name: opt,
            value: responseCounts[opt],
            fill: idx === 0 ? "hsl(var(--success))" : 
                  idx === 1 ? "hsl(var(--destructive))" : 
                  idx === 2 ? "hsl(var(--accent))" : 
                  "hsl(var(--primary))"
          }));
        }

        return {
          id: questionData.id,
          question: questionData.question_text,
          type,
          totalResponses,
          responseRate,
          responses: chartData,
        };
      });

      setRealQuestions(processedQuestions);
    };

    loadRealQuestions();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Question Analytics</h1>
        <p className="text-muted-foreground text-lg">Detailed insights for each feedback question</p>
      </div>

      {/* Questions List */}
      <Accordion type="single" collapsible className="space-y-4">
        {/* Real Questions from Database */}
        {realQuestions.map((realQuestion, index) => (
          <AccordionItem 
            key={realQuestion.id} 
            value={`question-${realQuestion.id}`}
            className="border rounded-lg shadow-md bg-card animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-start justify-between w-full pr-4">
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold mb-2">{realQuestion.question}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline">{realQuestion.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {realQuestion.totalResponses} responses
                    </span>
                    <span className="text-sm text-success flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {realQuestion.responseRate}% response rate
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-6 pb-6">
              {/* Analytics Content */}
              <div className="grid lg:grid-cols-2 gap-6 pt-4">
                {/* Chart Section */}
                {(realQuestion.type === "Multiple Choice" || realQuestion.type === "Yes/No") && realQuestion.responses.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Response Distribution
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={realQuestion.responses}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {realQuestion.responses.map((entry: any, idx: number) => (
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
                  </div>
                )}

                {/* Stats/Details Section */}
                {(realQuestion.type === "Multiple Choice" || realQuestion.type === "Yes/No") && realQuestion.totalResponses > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Response Breakdown</h4>
                    <div className="space-y-3">
                      {realQuestion.responses?.map((response: any, idx: number) => (
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
                              ({realQuestion.totalResponses > 0 ? ((response.value / realQuestion.totalResponses) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* More Info Button */}
              <div className="mt-6 pt-6 border-t">
                <Button 
                  onClick={() => navigate(`/analytics/${realQuestion.id}`)}
                  className="w-full"
                >
                  More Info
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
        
        {/* Mock Questions */}
        {questionsData.map((question, index) => (
          <AccordionItem 
            key={question.id} 
            value={`question-${question.id}`}
            className="border rounded-lg shadow-md bg-card animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-start justify-between w-full pr-4">
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
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
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-6 pb-6">
              {/* Analytics Content */}
              <div className="grid lg:grid-cols-2 gap-6 pt-4">
                {/* Chart Section */}
                {(question.type === "Multiple Choice" || question.type === "Yes/No") && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Response Distribution
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={question.responses}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {question.responses.map((entry, idx) => (
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
                  </div>
                )}

                {/* Stats/Details Section - Only for Multiple Choice and Yes/No */}
                {(question.type === "Multiple Choice" || question.type === "Yes/No") && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Response Breakdown</h4>
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
                  </div>
                )}

                {/* Ranking Results */}
                {question.type === "Ranking" && question.finalRanking && (
                  <>
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <Trophy className="mr-2 h-5 w-5 text-primary" />
                        Overall Ranking
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={question.finalRanking} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                          <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
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
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-4">Top Preferences</h4>
                      <div className="space-y-3">
                        {question.finalRanking.slice(0, 3).map((item, idx) => (
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
                    </div>
                  </>
                )}

              </div>

              {/* More Info Button */}
              <div className="mt-6 pt-6 border-t">
                <Button 
                  onClick={() => navigate(`/analytics/${question.id}`)}
                  className="w-full"
                >
                  More Info
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Analytics;
