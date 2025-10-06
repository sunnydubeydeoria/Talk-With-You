interface TypingUser {
  username: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0].username} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
      : `${typingUsers.length} people are typing...`;

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground italic flex items-center gap-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      {text}
    </div>
  );
};

export default TypingIndicator;
