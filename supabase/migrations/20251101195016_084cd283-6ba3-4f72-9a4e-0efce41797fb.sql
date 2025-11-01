-- Enable realtime for user_progress table
ALTER TABLE public.user_progress REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_progress;