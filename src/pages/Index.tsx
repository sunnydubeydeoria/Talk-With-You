import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Users, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-space flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <main className="w-full max-w-4xl mx-auto relative z-10 animate-fade-in-up">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm">
              <MessageSquare className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            ChatSphere
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create or join secure chat rooms and connect with people in real-time. 
            Modern, fast, and secure communication at your fingertips.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => navigate("/create-room")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-primary/50 transition-all animate-glow"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Create Room
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/join-room")}
              className="border-primary/30 hover:bg-primary/10 text-lg px-8 py-6 rounded-xl"
            >
              <Users className="mr-2 h-5 w-5" />
              Join Room
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur-md border-border/50 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Messaging</h3>
            <p className="text-sm text-muted-foreground">
              Instant message delivery with typing indicators and live updates
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-md border-border/50 hover:border-secondary/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Room-based access control with validated messages and XSS protection
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-md border-border/50 hover:border-accent/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Active Users</h3>
            <p className="text-sm text-muted-foreground">
              See who's online and track activity in real-time
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
