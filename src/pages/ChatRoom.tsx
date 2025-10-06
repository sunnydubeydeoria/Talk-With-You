import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Users as UsersIcon, Check } from "lucide-react";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import UsersList from "@/components/chat/UsersList";
import TypingIndicator from "@/components/chat/TypingIndicator";

interface Message {
  id: string;
  username: string;
  content: string;
  created_at: string;
}

interface Participant {
  id: string;
  username: string;
  joined_at: string;
}

interface TypingUser {
  username: string;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const username = location.state?.username;
  const [roomName, setRoomName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [copied, setCopied] = useState(false);
  const [showUsers, setShowUsers] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!username || !roomId) {
      navigate("/");
      return;
    }

    loadRoomData();
    subscribeToMessages();
    subscribeToParticipants();
    subscribeToTyping();

    return () => {
      // Cleanup: Remove participant when leaving
      if (roomId && username) {
        supabase
          .from("room_participants")
          .delete()
          .match({ room_id: roomId, username });
      }
    };
  }, [roomId, username, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadRoomData = async () => {
    if (!roomId) return;

    // Load room info
    const { data: room } = await supabase
      .from("rooms")
      .select("name")
      .eq("id", roomId)
      .single();

    if (room) setRoomName(room.name);

    // Load messages
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (messagesData) setMessages(messagesData);

    // Load participants
    const { data: participantsData } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });

    if (participantsData) setParticipants(participantsData);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`participants:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_participants",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setParticipants((prev) => [...prev, payload.new as Participant]);
          } else if (payload.eventType === "DELETE") {
            setParticipants((prev) =>
              prev.filter((p) => p.id !== (payload.old as Participant).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = () => {
    const channel = supabase
      .channel(`typing:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const indicator = payload.new as { username: string; is_typing: boolean };
            if (indicator.is_typing && indicator.username !== username) {
              setTypingUsers((prev) => {
                const exists = prev.find((u) => u.username === indicator.username);
                if (!exists) return [...prev, { username: indicator.username }];
                return prev;
              });
            } else {
              setTypingUsers((prev) =>
                prev.filter((u) => u.username !== indicator.username)
              );
            }
          } else if (payload.eventType === "DELETE") {
            const indicator = payload.old as { username: string };
            setTypingUsers((prev) =>
              prev.filter((u) => u.username !== indicator.username)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (content: string) => {
    if (!roomId || !username) return;

    const { error } = await supabase
      .from("messages")
      .insert({ room_id: roomId, username, content });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleTyping = async () => {
    if (!roomId || !username) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    await supabase
      .from("typing_indicators")
      .upsert(
        { room_id: roomId, username, is_typing: true, updated_at: new Date().toISOString() },
        { onConflict: "room_id,username" }
      );

    // Clear typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from("typing_indicators")
        .delete()
        .match({ room_id: roomId, username });
    }, 2000);
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Room ID copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-screen bg-gradient-space flex flex-col">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{roomName}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs">{roomId}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyRoomId}
                  className="h-6 px-2"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUsers(!showUsers)}
            className="md:hidden"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            {participants.length}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col p-4">
          <Card className="flex-1 bg-card/50 backdrop-blur-md border-border/50 flex flex-col overflow-hidden">
            <MessageList messages={messages} currentUsername={username} />
            <TypingIndicator typingUsers={typingUsers} />
            <div ref={messagesEndRef} />
          </Card>
          <MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
        </div>

        {/* Users Sidebar */}
        {showUsers && (
          <div className="w-64 p-4 hidden md:block">
            <UsersList participants={participants} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
