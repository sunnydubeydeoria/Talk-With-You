import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const createRoomSchema = z.object({
  username: z.string().trim().min(2, "Username must be at least 2 characters").max(20, "Username must be less than 20 characters"),
  roomName: z.string().trim().min(3, "Room name must be at least 3 characters").max(50, "Room name must be less than 50 characters"),
});

const CreateRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; roomName?: string }>({});

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const validation = createRoomSchema.safeParse({ username, roomName });
    if (!validation.success) {
      const fieldErrors: { username?: string; roomName?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "username") fieldErrors.username = err.message;
        if (err.path[0] === "roomName") fieldErrors.roomName = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Create room
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({ name: roomName })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add user as participant
      const { error: participantError } = await supabase
        .from("room_participants")
        .insert({ room_id: room.id, username: validation.data.username });

      if (participantError) throw participantError;

      toast({
        title: "Room created!",
        description: `Welcome to ${roomName}`,
      });

      // Navigate to chat room
      navigate(`/room/${room.id}`, { state: { username: validation.data.username } });
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
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
              <div className="p-3 rounded-xl bg-primary/20">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Create Chat Room</CardTitle>
            <CardDescription>
              Start a new room and invite others to join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom} className="space-y-4">
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
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="Enter room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-background/50"
                  maxLength={50}
                />
                {errors.roomName && (
                  <p className="text-sm text-destructive">{errors.roomName}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Room"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRoom;
