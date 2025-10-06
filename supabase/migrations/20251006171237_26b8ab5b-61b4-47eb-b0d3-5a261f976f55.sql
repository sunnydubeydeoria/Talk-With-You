-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_participants table to track who's in each room
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, username)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create typing_indicators table for real-time typing status
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, username)
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (anyone can read/create rooms)
CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update room activity"
  ON public.rooms FOR UPDATE
  USING (true);

-- RLS Policies for room_participants
CREATE POLICY "Anyone can view participants"
  ON public.room_participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join rooms"
  ON public.room_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can leave rooms"
  ON public.room_participants FOR DELETE
  USING (true);

-- RLS Policies for messages
CREATE POLICY "Anyone can view messages"
  ON public.messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- RLS Policies for typing_indicators
CREATE POLICY "Anyone can view typing indicators"
  ON public.typing_indicators FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update typing status"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own typing status"
  ON public.typing_indicators FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete typing indicators"
  ON public.typing_indicators FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_room_participants_room_id ON public.room_participants(room_id);
CREATE INDEX idx_typing_indicators_room_id ON public.typing_indicators(room_id);

-- Function to update room activity timestamp
CREATE OR REPLACE FUNCTION public.update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.rooms 
  SET last_activity = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update room activity on new messages
CREATE TRIGGER update_room_activity_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_activity();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;