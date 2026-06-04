-- Remove overly permissive UPDATE policy on rooms (last_activity already maintained via SECURITY DEFINER trigger)
DROP POLICY IF EXISTS "Anyone can update room activity" ON public.rooms;

-- Tighten messages INSERT policy: sender must exist as a participant of the room
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = messages.room_id
        AND rp.username = messages.username
    )
  );
