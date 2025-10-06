import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { z } from "zod";

const messageSchema = z.string().trim().min(1).max(1000);

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
}

const MessageInput = ({ onSend, onTyping }: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = messageSchema.safeParse(message);
    if (!validation.success) return;

    onSend(validation.data);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="min-h-[60px] max-h-[120px] resize-none bg-background/50 backdrop-blur-sm"
          maxLength={1000}
        />
        <Button
          type="submit"
          size="icon"
          className="h-[60px] w-[60px] bg-primary hover:bg-primary/90 shrink-0"
          disabled={!messageSchema.safeParse(message).success}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
