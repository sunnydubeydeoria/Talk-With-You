-- Fix the search path for the update_room_activity function
CREATE OR REPLACE FUNCTION public.update_room_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE public.rooms 
  SET last_activity = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;