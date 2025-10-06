import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface Participant {
  id: string;
  username: string;
  joined_at: string;
}

interface UsersListProps {
  participants: Participant[];
}

const UsersList = ({ participants }: UsersListProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-md border-border/50 p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Active Users</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {participants.length}
        </span>
      </div>

      <div className="space-y-3">
        {participants.map((participant) => {
          const userColor = getUserColor(participant.username);

          return (
            <div
              key={participant.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-background" style={{ borderColor: userColor }}>
                <AvatarFallback style={{ backgroundColor: userColor }}>
                  {getInitials(participant.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: userColor }}>
                  {participant.username}
                </p>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default UsersList;
