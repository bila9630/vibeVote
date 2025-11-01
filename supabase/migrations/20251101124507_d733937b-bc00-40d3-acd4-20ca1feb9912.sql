-- Create table for storing poll/survey questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for storing user responses
CREATE TABLE IF NOT EXISTS public.user_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  response_text TEXT,
  selected_option TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions (publicly readable)
CREATE POLICY "Anyone can view questions"
  ON public.questions
  FOR SELECT
  USING (true);

-- RLS Policies for user_responses (users can only see and create their own)
CREATE POLICY "Users can view their own responses"
  ON public.user_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own responses"
  ON public.user_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_user_responses_user_id ON public.user_responses(user_id);
CREATE INDEX idx_user_responses_question_id ON public.user_responses(question_id);