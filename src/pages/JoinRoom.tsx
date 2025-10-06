import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const joinRoomSchema = z.object({
  username: z.string().trim().min(2, "Username must be at least 2 characters").max(20, "Username must be less than 20 characters"),
  roomId: z.string().trim().uuid("Invalid Room ID format"),
});

const JoinRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; roomId?: string }>({});

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const validation = joinRoomSchema.safeParse({ username, roomId });
    if (!validation.success) {
      const fieldErrors: { username?: string; roomId?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "username") fieldErrors.username = err.message;
        if (err.path[0] === "roomId") fieldErrors.roomId = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Check if room exists
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("id", validation.data.roomId)
        .maybeSingle();

      if (roomError) throw roomError;

      if (!room) {
        setErrors({ roomId: "Room not found" });
        setLoading(false);
        return;
      }

      // Check if username already exists in this room
      const { data: existingParticipant } = await supabase
        .from("room_participants")
        .select("username")
        .eq("room_id", room.id)
        .eq("username", validation.data.username)
        .maybeSingle();

      if (existingParticipant) {
        setErrors({ username: "Username already taken in this room" });
        setLoading(false);
        return;
      }

      // Add user as participant
      const { error: participantError } = await supabase
        .from("room_participants")
        .insert({ room_id: room.id, username: validation.data.username });

      if (participantError) throw participantError;

      toast({
        title: "Joined room!",
        description: `Welcome to ${room.name}`,
      });

      // Navigate to chat room
      navigate(`/room/${room.id}`, { state: { username: validation.data.username } });
    } catch (error: any) {
      console.error("Error joining room:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-secondary/20">
                <Users className="w-8 h-8 text-secondary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Join Chat Room</CardTitle>
            <CardDescription>
              Enter the Room ID to join an existing chat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Your Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background/50"
                  maxLength={20}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-background/50 font-mono text-sm"
                />
                {errors.roomId && (
                  <p className="text-sm text-destructive">{errors.roomId}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90"
                disabled={loading}
              >
                {loading ? "Joining..." : "Join Room"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinRoom;
