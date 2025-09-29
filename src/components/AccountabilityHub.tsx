import { useState } from "react";
import { Users, Calendar, Video, MessageSquare, Trophy, Clock, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AccountabilityPartner {
  id: string;
  name: string;
  avatar: string;
  goals: string[];
  streakDays: number;
  meetingPreference: "weekly" | "biweekly" | "monthly";
  timezone: string;
}

interface WeeklySession {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: AccountabilityPartner[];
  zoomLink?: string;
  status: "scheduled" | "completed" | "missed";
  agenda: string[];
}

export function AccountabilityHub() {
  const { toast } = useToast();
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [zoomWebhookUrl, setZoomWebhookUrl] = useState("");

  // Mock data - in real app this would come from Supabase
  const [partners] = useState<AccountabilityPartner[]>([
    {
      id: "1",
      name: "Sarah Chen",
      avatar: "/api/placeholder/40/40",
      goals: ["Launch SaaS", "Learn Python"],
      streakDays: 12,
      meetingPreference: "weekly",
      timezone: "PST"
    },
    {
      id: "2", 
      name: "Marcus Johnson",
      avatar: "/api/placeholder/40/40",
      goals: ["Fitness Goals", "Side Business"],
      streakDays: 8,
      meetingPreference: "weekly",
      timezone: "EST"
    }
  ]);

  const [upcomingSessions] = useState<WeeklySession[]>([
    {
      id: "1",
      title: "Weekly Goal Check-in",
      date: "2024-02-05",
      time: "10:00 AM",
      participants: partners,
      zoomLink: "https://zoom.us/j/123456789",
      status: "scheduled",
      agenda: ["Progress updates", "Challenges faced", "Next week planning", "Mutual support"]
    },
    {
      id: "2",
      title: "Goal Strategy Session",
      date: "2024-02-12",
      time: "10:00 AM", 
      participants: [partners[0]],
      status: "scheduled",
      agenda: ["Deep dive on obstacles", "Strategy refinement", "Accountability commitments"]
    }
  ]);

  const handleScheduleZoomSession = async () => {
    if (!zoomWebhookUrl) {
      toast({
        title: "Webhook Required",
        description: "Please add your Zapier webhook URL to auto-create Zoom meetings",
        variant: "destructive",
      });
      return;
    }

    try {
      await fetch(zoomWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          event: "schedule_accountability_session",
          date: new Date().toISOString(),
          participants: partners.length,
          type: "weekly_checkin"
        }),
      });

      toast({
        title: "Zoom Session Scheduled! 📹",
        description: "Check your Zapier workflow to confirm the meeting was created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger Zoom scheduling. Check your webhook URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-success bg-clip-text text-transparent">
            Accountability Hub
          </h2>
          <p className="text-muted-foreground">
            Stay committed with weekly check-ins and accountability partners
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Find Partner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Find Accountability Partner</DialogTitle>
                <DialogDescription>
                  Connect with like-minded goal achievers for mutual support
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    💡 <strong>Connect to Supabase</strong> to enable partner matching based on:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Similar goal categories</li>
                    <li>• Compatible time zones</li>
                    <li>• Meeting preferences</li>
                    <li>• Commitment levels</li>
                  </ul>
                </div>
                <Button className="w-full" disabled>
                  Enable Partner Matching (Requires Supabase)
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-success hover:shadow-success transition-all duration-300">
                <Video className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Accountability Session</DialogTitle>
                <DialogDescription>
                  Set up a weekly Zoom check-in with your accountability partners
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook">Zapier Webhook URL (for Zoom integration)</Label>
                  <Input
                    id="webhook"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={zoomWebhookUrl}
                    onChange={(e) => setZoomWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a Zap with Webhook → Zoom to auto-schedule meetings
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly Check-in</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly Deep Dive</SelectItem>
                      <SelectItem value="monthly">Monthly Strategy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Session Agenda</Label>
                  <Textarea
                    placeholder="Enter discussion topics..."
                    defaultValue="• Progress updates&#10;• Challenges faced&#10;• Next week commitments&#10;• Mutual support & feedback"
                  />
                </div>

                <Button onClick={handleScheduleZoomSession} className="w-full">
                  <Video className="w-4 h-4 mr-2" />
                  Schedule with Zoom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-accent">{partners.length}</p>
                <p className="text-sm text-muted-foreground">Active Partners</p>
              </div>
              <Users className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">3</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
              <Calendar className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">94%</p>
                <p className="text-sm text-muted-foreground">Attendance</p>
              </div>
              <Clock className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Upcoming Sessions
            </CardTitle>
            <CardDescription>
              Your scheduled accountability meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {session.date} at {session.time}
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {session.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {session.participants.map((participant, idx) => (
                      <Avatar key={participant.id} className="w-6 h-6 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {session.participants.length} participants
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Agenda:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {session.agenda.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                {session.zoomLink && (
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    onClick={() => window.open(session.zoomLink, '_blank')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Zoom Meeting
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Accountability Partners */}
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-accent" />
              Your Partners
            </CardTitle>
            <CardDescription>
              People keeping you accountable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partners.map((partner) => (
              <div key={partner.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {partner.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {partner.goals.join(", ")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        🔥 {partner.streakDays} days
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {partner.timezone}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            ))}
            
            <div className="p-4 rounded-lg border-2 border-dashed border-border/50 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Find more accountability partners based on your goals
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowPartnerDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Find Partners
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Commitment Tracker */}
      <Card className="bg-gradient-card border-border shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-warning" />
            This Week's Commitments
          </CardTitle>
          <CardDescription>
            What you committed to in your last accountability session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { commitment: "Complete MVP testing", progress: 80, partner: "Sarah Chen" },
              { commitment: "Publish 3 blog posts", progress: 67, partner: "Marcus Johnson" },
              { commitment: "Exercise 4 times", progress: 50, partner: "Sarah Chen" },
              { commitment: "Learn React hooks", progress: 90, partner: "Marcus Johnson" },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm">{item.commitment}</p>
                  <span className="text-xs text-muted-foreground">{item.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-success h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Partner: {item.partner}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}