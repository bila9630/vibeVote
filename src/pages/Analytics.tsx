import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, Heart, AlertTriangle, Sparkles, Wrench, Target, TrendingDown } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
];

const Analytics = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Question Analytics</h1>
        <p className="text-muted-foreground text-lg">Detailed insights for each feedback question</p>
      </div>

      {/* Questions List */}
      <Accordion type="single" collapsible className="space-y-4">
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

                {/* Stats/Details Section */}
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

                {/* Sentiment Analysis for Open-ended */}
                {question.type === "Open-ended" && question.sentiment && (
                  <>
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                        Sentiment Analysis
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
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
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-4">Recent Feedback</h4>
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
                    </div>
                  </>
                )}
              </div>

              {/* Key Observations and Actionable Insights */}
              <div className="grid lg:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                {/* Key Observations */}
                <Card className="bg-primary/5 border-primary/20">
                  <div className="p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Target className="mr-2 h-5 w-5 text-primary" />
                      Key Observations
                    </h4>
                    <div className="space-y-3">
                      {question.keyObservations?.map((observation, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {idx + 1}
                          </div>
                          <div className="flex items-start gap-2 flex-1">
                            <observation.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                            <p className="text-sm">{observation.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Actionable Insights */}
                <Card className="bg-success/5 border-success/20">
                  <div className="p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-success" />
                      Actionable Insights
                    </h4>
                    <div className="space-y-3">
                      {question.actionableInsights?.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success font-semibold">
                            {idx + 1}
                          </div>
                          <div className="flex items-start gap-2 flex-1">
                            <insight.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                            <p className="text-sm">{insight.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Analytics;
