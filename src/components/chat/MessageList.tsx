import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import DOMPurify from 'dompurify';

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

// Security utilities for message content processing
const sanitizeMessage = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
  });
};

const processLinks = (content: string): string => {
  // Find and process URLs, making them safe links
  const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/g;
  return content.replace(urlRegex, (url) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    // Basic URL validation
    try {
      const urlObj = new URL(fullUrl);
      // Only allow http and https protocols
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${escapeHtml(url)}</a>`;
      }
    } catch {
      // Invalid URL, return as-is
    }
    return escapeHtml(url);
  });
};

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const processEmojis = (content: string): string => {
  // Basic emoji support - preserve existing emojis
  // You could integrate with a library like emoji-js here
  return content;
};

const formatMessageContent = (content: string): { html: string; plainText: string } => {
  // Sanitize content first
  const sanitized = sanitizeMessage(content);

  // Process links
  const withLinks = processLinks(sanitized);

  // Process emojis
  const withEmojis = processEmojis(withLinks);

  // Extract plain text for accessibility
  const plainText = DOMPurify.sanitize(withEmojis, { ALLOWED_TAGS: [] });

  return {
    html: withEmojis,
    plainText: plainText
  };
};

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
