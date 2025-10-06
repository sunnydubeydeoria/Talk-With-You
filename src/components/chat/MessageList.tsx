import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Message {
  id: string;
  username: string;
  content: string;
  created_at: string;
}

interface MessageListProps {
  messages: Message[];
  currentUsername?: string;
}

const MessageList = ({ messages, currentUsername }: MessageListProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (username: string) => {
    // Generate consistent color based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.username === currentUsername;
          const userColor = getUserColor(message.username);

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""} animate-fade-in`}
            >
              <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-background" style={{ borderColor: userColor }}>
                <AvatarFallback style={{ backgroundColor: userColor }}>
                  {getInitials(message.username)}
                </AvatarFallback>
              </Avatar>

              <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? "items-end" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: userColor }}>
                    {message.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), "HH:mm")}
                  </span>
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl backdrop-blur-sm ${
                    isOwnMessage
                      ? "bg-primary/20 rounded-tr-sm"
                      : "bg-muted/50 rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default MessageList;
