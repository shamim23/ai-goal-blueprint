import { useState } from "react";
import { Target, Calendar, TrendingUp, CheckCircle, Circle, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal, Action } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface GoalCardProps {
  goal: Goal;
  onUpdate: (updates: Partial<Goal>) => void;
}

const categoryColors = {
  business: "bg-gradient-primary",
  personal: "bg-gradient-success", 
  health: "bg-red-500",
  learning: "bg-blue-500"
};

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const { toast } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");

  const daysUntilDeadline = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleAddAction = () => {
    if (!newActionTitle.trim()) return;

    const newAction: Action = {
      id: Date.now().toString(),
      title: newActionTitle,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      impact: 10
    };

    onUpdate({
      actions: [...goal.actions, newAction]
    });

    setNewActionTitle("");
    toast({
      title: "Action Added! ✅",
      description: `"${newAction.title}" added to ${goal.title}`,
    });
  };

  const toggleAction = (actionId: string) => {
    const updatedActions = goal.actions.map(action =>
      action.id === actionId ? { ...action, completed: !action.completed } : action
    );
    
    const completedCount = updatedActions.filter(a => a.completed).length;
    const newProgress = Math.round((completedCount / updatedActions.length) * 100);

    onUpdate({
      actions: updatedActions,
      progress: newProgress || 0
    });

    toast({
      title: "Progress Updated! 🎯",
      description: `${goal.title} is now ${newProgress}% complete`,
    });
  };

  return (
    <Card className="bg-gradient-card border-border shadow-elegant hover:shadow-glow transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={categoryColors[goal.category]} variant="secondary">
                {goal.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : "Overdue"}
              </Badge>
            </div>
            <CardTitle className="text-xl">{goal.title}</CardTitle>
            <CardDescription className="mt-2">{goal.description}</CardDescription>
          </div>
          <Target className="w-6 h-6 text-primary" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        {/* Actions Summary */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>{goal.actions.filter(a => a.completed).length} completed</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Circle className="w-4 h-4 text-muted-foreground" />
              <span>{goal.actions.filter(a => !a.completed).length} pending</span>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{goal.title}</DialogTitle>
                <DialogDescription>{goal.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Progress Details */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Overall Progress</h3>
                    <span className="text-2xl font-bold text-primary">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-3" />
                </div>

                {/* Actions */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Actions & Tasks</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new action..."
                        value={newActionTitle}
                        onChange={(e) => setNewActionTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAction()}
                        className="w-48"
                      />
                      <Button size="sm" onClick={handleAddAction}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {goal.actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <button
                          onClick={() => toggleAction(action.id)}
                          className="flex-shrink-0"
                        >
                          {action.completed ? (
                            <CheckCircle className="w-5 h-5 text-accent" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {action.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {action.date} • Impact: +{action.impact} points
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {goal.actions.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No actions yet. Add your first action above!
                      </p>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h3 className="font-semibold mb-3">Milestones</h3>
                  <div className="space-y-2">
                    {goal.milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-center gap-3 p-2">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          milestone.completed 
                            ? 'bg-accent border-accent' 
                            : 'border-muted-foreground'
                        }`} />
                        <div className="flex-1">
                          <p className={`font-medium ${milestone.completed ? 'text-accent' : ''}`}>
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{milestone.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}