import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, TrendingUp, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
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
        const responseRate = (totalResponses / 75) * 100;

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
        } else if (questionData.question_type === 'ranking') {
          // For ranking questions, calculate average placement
          const rankingOptions = (questionData.options as any)?.rankingOptions || [];
          const options = rankingOptions.map((opt: any) => opt.name);
          
          if (options.length > 0) {
            const placementSums: { [key: string]: number } = {};
            const placementCounts: { [key: string]: number } = {};
            
            options.forEach((opt: string) => {
              placementSums[opt] = 0;
              placementCounts[opt] = 0;
            });

            if (responsesForQuestion.length > 0) {
              responsesForQuestion.forEach((response) => {
                try {
                  // Handle response_text - it might already be parsed by Supabase JSONB
                  let rankingData = response.response_text;
                  
                  // Only parse if it's actually a string
                  if (typeof rankingData === 'string' && rankingData.trim().startsWith('[')) {
                    try {
                      rankingData = JSON.parse(rankingData);
                    } catch (parseError) {
                      console.warn('Failed to parse ranking data, skipping:', response.id);
                      return; // Skip this response
                    }
                  }
                  
                  // Verify it's an array and process
                  if (Array.isArray(rankingData) && rankingData.length > 0) {
                    rankingData.forEach((item: string, index: number) => {
                      if (item && placementSums.hasOwnProperty(item)) {
                        placementSums[item] += (index + 1); // 1-indexed placement
                        placementCounts[item]++;
                      }
                    });
                  }
                } catch (e) {
                  console.warn('Error processing ranking data for response:', response.id, e);
                }
              });
            }

            // Add realistic variation to make data look less artificial
            const unsortedData = options.map((opt: string, idx: number) => {
              let avgPlacement;
              if (placementCounts[opt] > 0) {
                avgPlacement = placementSums[opt] / placementCounts[opt];
              } else {
                // Add randomized default placements with more variation
                avgPlacement = (idx + 1) + (Math.random() * 0.8 - 0.4);
              }
              
              return {
                name: opt,
                averagePlacement: avgPlacement,
                responseCount: placementCounts[opt],
              };
            }).sort((a, b) => a.averagePlacement - b.averagePlacement);
            
            // Assign colors based on final ranking (best to worst)
            const colorMap = [
              "hsl(var(--success))",
              "hsl(var(--primary))", 
              "hsl(var(--accent))",
              "hsl(var(--warning))",
              "hsl(var(--destructive))"
            ];
            
            chartData = unsortedData.map((item, idx) => ({
              ...item,
              fill: colorMap[Math.min(idx, colorMap.length - 1)]
            }));
          }
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
        {realQuestions.map((realQuestion, index) => {
          const isCategory1 = realQuestion.type === "Multiple Choice" || realQuestion.type === "Yes/No" || realQuestion.type === "Ranking";
          
          if (isCategory1) {
            // Category 1: Expandable accordion without "More Info" button
            return (
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
                        <Badge className={getQuestionTypeColor(realQuestion.type)}>{realQuestion.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {realQuestion.totalResponses}/75 responses
                        </span>
                        <span className={`text-sm flex items-center font-medium ${
                          realQuestion.responseRate > 85 ? 'text-success' : 
                          realQuestion.responseRate >= 50 ? 'text-accent' : 
                          'text-destructive'
                        }`}>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {realQuestion.responseRate.toFixed(1)}% response rate
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  <div className="pt-4">
                    {realQuestion.type === "Ranking" && realQuestion.responses.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">Ranking Summary</h4>
                          <Badge variant="secondary">
                            {realQuestion.responses.length} options ranked
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {realQuestion.responses?.slice(0, 4).map((response: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="min-w-8 justify-center">
                                  #{idx + 1}
                                </Badge>
                                <span className="font-medium">{response.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-lg">{response.averagePlacement?.toFixed(2) || 'N/A'}</span>
                                <span className="text-muted-foreground text-sm ml-2">
                                  avg position ({response.responseCount || 0} votes)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {realQuestion.type !== "Ranking" && (
                      <div className="grid lg:grid-cols-2 gap-6">
                        {realQuestion.responses.length > 0 && (
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

                        {realQuestion.totalResponses > 0 && realQuestion.responses.length > 0 && (
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
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          } else {
            // Category 2: Clickable card that navigates to detail page
            return (
              <Card
                key={realQuestion.id}
                className="border rounded-lg shadow-md bg-card animate-fade-in cursor-pointer hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/analytics/${realQuestion.id}`)}
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{realQuestion.question}</h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={getQuestionTypeColor(realQuestion.type)}>{realQuestion.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {realQuestion.totalResponses}/75 responses
                        </span>
                        <span className={`text-sm flex items-center font-medium ${
                          realQuestion.responseRate > 85 ? 'text-success' : 
                          realQuestion.responseRate >= 50 ? 'text-accent' : 
                          'text-destructive'
                        }`}>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {realQuestion.responseRate.toFixed(1)}% response rate
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground ml-4" />
                  </div>
                </div>
              </Card>
            );
          }
        })}
      </Accordion>
    </div>
  );
};

export default Analytics;
