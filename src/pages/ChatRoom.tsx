import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase, withRetry, isSupabaseHealthy } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Users as UsersIcon, Check, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
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

// Constants for optimization
const MESSAGES_PER_PAGE = 50;
const TYPING_TIMEOUT = 2000;
const OFFLINE_MESSAGE_QUEUE_KEY = 'chatsphere_offline_messages';
const CONNECTION_RETRY_DELAY = 3000;

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageIds, setMessageIds] = useState<Set<string>>(new Set()); // For deduplication

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<{ messages: any; participants: any; typing: any } | null>(null);

  // Memoized values to prevent unnecessary recalculations
  const memoizedParticipants = useMemo(() => participants, [participants]);
  const memoizedTypingUsers = useMemo(() => typingUsers.filter(u => u.username !== username), [typingUsers, username]);

  // Connection health monitoring
  const checkConnection = useCallback(async () => {
    const healthy = await isSupabaseHealthy();
    setIsOnline(healthy);

    if (!healthy) {
      // Schedule retry
      connectionRetryTimeoutRef.current = setTimeout(() => {
        checkConnection();
      }, CONNECTION_RETRY_DELAY);
    }

    return healthy;
  }, []);

  // Add participant with retry logic
  const addParticipant = useCallback(async () => {
    if (!roomId || !username) return;

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from("room_participants")
          .upsert({
            room_id: roomId,
            username,
            joined_at: new Date().toISOString()
          }, {
            onConflict: "room_id,username"
          });

        if (error) throw error;
      });
    } catch (error) {
      console.error('Failed to add participant:', error);
      toast({
        title: "Connection Error",
        description: "Failed to join room. Please check your connection.",
        variant: "destructive",
      });
    }
  }, [roomId, username, toast]);

  // Optimized message loading with pagination
  const loadMessages = useCallback(async (page = 0, append = false) => {
    if (!roomId || (!append && !hasMoreMessages)) return;

    try {
      setIsLoadingMore(true);

      const { data: messagesData, error } = await withRetry(async () => {
        return await supabase
          .from("messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);
      });

      if (error) throw error;

      if (messagesData) {
        // Deduplicate messages
        const newMessages = messagesData.reverse().filter(
          message => !messageIds.has(message.id)
        );

        if (append) {
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }

        // Update message IDs set
        setMessageIds(prev => {
          const newSet = new Set(prev);
          newMessages.forEach(msg => newSet.add(msg.id));
          return newSet;
        });

        // Check if there are more messages
        setHasMoreMessages(messagesData.length === MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [roomId, messageIds, hasMoreMessages, toast]);

  // Load initial room data with connection check
  const loadRoomData = useCallback(async () => {
    if (!roomId) return;

    try {
      await withRetry(async () => {
        // Load room info
        const { data: room } = await supabase
          .from("rooms")
          .select("name")
          .eq("id", roomId)
          .single();

        if (room) setRoomName(room.name);

        // Load participants
        const { data: participantsData } = await supabase
          .from("room_participants")
          .select("*")
          .eq("room_id", roomId)
          .order("joined_at", { ascending: true });

        if (participantsData) setParticipants(participantsData);

        // Load initial messages
        await loadMessages(0, false);
      });
    } catch (error) {
      console.error('Failed to load room data:', error);
      toast({
        title: "Connection Error",
        description: "Failed to load room data. Please check your connection.",
        variant: "destructive",
      });
    }
  }, [roomId, loadMessages, toast]);

  // Optimized real-time subscriptions
  const subscribeToMessages = useCallback(() => {
    if (!roomId) return;

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
          const newMessage = payload.new as Message;

          // Deduplicate incoming message
          setMessageIds(prev => {
            if (prev.has(newMessage.id)) return prev;
            const newSet = new Set(prev);
            newSet.add(newMessage.id);
            return newSet;
          });

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Messages channel subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Messages channel error');
        }
      });

    return channel;
  }, [roomId]);

  const subscribeToParticipants = useCallback(() => {
    if (!roomId) return;

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
            setParticipants(prev => [...prev, payload.new as Participant]);
          } else if (payload.eventType === "DELETE") {
            setParticipants(prev =>
              prev.filter((p) => p.id !== (payload.old as Participant).id)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Participants channel subscribed');
        }
      });

    return channel;
  }, [roomId]);

  const subscribeToTyping = useCallback(() => {
    if (!roomId) return;

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
              setTypingUsers(prev => {
                const exists = prev.find(u => u.username === indicator.username);
                if (!exists) return [...prev, { username: indicator.username }];
                return prev;
              });
            } else {
              setTypingUsers(prev =>
                prev.filter(u => u.username !== indicator.username)
              );
            }
          } else if (payload.eventType === "DELETE") {
            const indicator = payload.old as { username: string };
            setTypingUsers(prev =>
              prev.filter(u => u.username !== indicator.username)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Typing channel subscribed');
        }
      });

    return channel;
  }, [roomId, username]);

  // Optimized message sending with offline queue
  const handleSendMessage = useCallback(async (content: string) => {
    if (!roomId || !username) return;

    const messageData = {
      room_id: roomId,
      username,
      content,
      created_at: new Date().toISOString()
    };

    // If online, send immediately
    if (isOnline) {
      try {
        const { error } = await withRetry(async () => {
          return await supabase.from("messages").insert(messageData);
        });

        if (error) throw error;
      } catch (error) {
        console.error('Failed to send message:', error);

        // Add to offline queue if send fails
        const offlineQueue = JSON.parse(localStorage.getItem(OFFLINE_MESSAGE_QUEUE_KEY) || '[]');
        offlineQueue.push({ ...messageData, id: crypto.randomUUID() });
        localStorage.setItem(OFFLINE_MESSAGE_QUEUE_KEY, JSON.stringify(offlineQueue));

        toast({
          title: "Message Queued",
          description: "Message will be sent when connection is restored",
        });
      }
    } else {
      // Add to offline queue
      const offlineQueue = JSON.parse(localStorage.getItem(OFFLINE_MESSAGE_QUEUE_KEY) || '[]');
      offlineQueue.push({ ...messageData, id: crypto.randomUUID() });
      localStorage.setItem(OFFLINE_MESSAGE_QUEUE_KEY, JSON.stringify(offlineQueue));

      toast({
        title: "Message Queued",
        description: "Message will be sent when connection is restored",
      });
    }
  }, [roomId, username, isOnline, toast]);

  // Process offline message queue
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || !roomId || !username) return;

    const offlineQueue = JSON.parse(localStorage.getItem(OFFLINE_MESSAGE_QUEUE_KEY) || '[]');
    if (offlineQueue.length === 0) return;

    try {
      for (const message of offlineQueue) {
        await supabase.from("messages").insert({
          room_id: roomId,
          username,
          content: message.content,
        });
      }

      // Clear queue after successful sending
      localStorage.removeItem(OFFLINE_MESSAGE_QUEUE_KEY);

      toast({
        title: "Messages Sent",
        description: `${offlineQueue.length} offline message(s) sent successfully`,
      });

      // Reload messages to get the sent ones
      await loadRoomData();
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }, [isOnline, roomId, username, toast, loadRoomData]);

  // Enhanced effect hooks with proper cleanup
  useEffect(() => {
    if (!username || !roomId) {
      navigate("/");
      return;
    }

    // Check connection and add participant
    checkConnection().then(healthy => {
      if (healthy) {
        addParticipant();
        loadRoomData();
      }
    });

    // Set up subscriptions
    const messagesChannel = subscribeToMessages();
    const participantsChannel = subscribeToParticipants();
    const typingChannel = subscribeToTyping();

    subscriptionRef.current = {
      messages: messagesChannel,
      participants: participantsChannel,
      typing: typingChannel,
    };

    // Monitor connection status
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connection check
    const connectionCheckInterval = setInterval(() => {
      checkConnection();
    }, 30000); // Check every 30 seconds

    return () => {
      // Cleanup timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (connectionRetryTimeoutRef.current) {
        clearTimeout(connectionRetryTimeoutRef.current);
      }
      clearInterval(connectionCheckInterval);

      // Cleanup subscriptions
      if (subscriptionRef.current) {
        Object.values(subscriptionRef.current).forEach(channel => {
          if (channel) supabase.removeChannel(channel);
        });
      }

      // Remove participant when leaving
      if (roomId && username) {
        supabase
          .from("room_participants")
          .delete()
          .match({ room_id: roomId, username })
          .then(() => console.log('Participant removed'));
      }

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [roomId, username, navigate, checkConnection, addParticipant, loadRoomData, subscribeToMessages, subscribeToParticipants, subscribeToTyping, processOfflineQueue]);

  // Auto-scroll to bottom with optimization
  const scrollToBottom = useCallback(() => {
    // Only scroll if user is at bottom (avoid interrupting manual scrolling)
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Optimized typing indicator with debouncing
  const handleTyping = useCallback(async () => {
    if (!roomId || !username || !isOnline) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      // Set typing indicator
      await withRetry(async () => {
        return await supabase
          .from("typing_indicators")
          .upsert(
            {
              room_id: roomId,
              username,
              is_typing: true,
              updated_at: new Date().toISOString()
            },
            { onConflict: "room_id,username" }
          );
      });
    } catch (error) {
      console.error('Failed to set typing indicator:', error);
    }

    // Clear typing after timeout
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await withRetry(async () => {
          return await supabase
            .from("typing_indicators")
            .delete()
            .match({ room_id: roomId, username });
        });
      } catch (error) {
        console.error('Failed to clear typing indicator:', error);
      }
    }, TYPING_TIMEOUT);
  }, [roomId, username, isOnline]);

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
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{roomName || 'Chat Room'}</h1>
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-1 text-sm">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isOnline ? "bg-green-500" : "bg-red-500 animate-pulse"
                    )}
                    aria-hidden="true"
                  />
                  <span className={cn(
                    "text-xs",
                    isOnline ? "text-green-500" : "text-red-500"
                  )}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  {!isOnline && (
                    <WifiOff className="h-3 w-3 text-red-500" aria-hidden="true" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs">{roomId}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyRoomId}
                  className="h-6 px-2"
                  aria-label={copied ? "Room ID copied" : "Copy room ID"}
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
          <div className="flex items-center gap-2">
            {/* Participants count */}
            <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              <UsersIcon className="h-4 w-4" />
              <span>{memoizedParticipants.length}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUsers(!showUsers)}
              className="md:hidden"
              aria-label={`Toggle users list (${participants.length} users)`}
            >
              <UsersIcon className="h-4 w-4 mr-2" />
              {participants.length}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col p-4">
          <Card className="flex-1 bg-card/50 backdrop-blur-md border-border/50 flex flex-col overflow-hidden relative">
            {/* Connection Status Banner */}
            {!isOnline && (
              <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">
                    You're offline. Messages will be queued and sent when connection is restored.
                  </span>
                </div>
              </div>
            )}

            {/* Messages Container with scroll ref */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              <div className="flex flex-col h-full">
                {/* Load More Button */}
                {hasMoreMessages && (
                  <div className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadMessages(Math.floor(messages.length / MESSAGES_PER_PAGE), true)}
                      disabled={isLoadingMore}
                      className="text-xs"
                    >
                      {isLoadingMore ? "Loading..." : "Load More Messages"}
                    </Button>
                  </div>
                )}

                {/* Message List */}
                <div className="flex-1">
                  <MessageList messages={messages} currentUsername={username} />
                </div>

                {/* Typing Indicator */}
                <div className="shrink-0">
                  <TypingIndicator typingUsers={memoizedTypingUsers} />
                </div>

                {/* Scroll Anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </Card>

          {/* Message Input */}
          <MessageInput
            onSend={handleSendMessage}
            onTyping={handleTyping}
            disabled={!isOnline}
          />
        </div>

        {/* Users Sidebar */}
        {showUsers && (
          <div className="w-64 p-4 hidden md:block">
            <UsersList participants={memoizedParticipants} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
