import { useState } from "react";
import { Target, Calendar, TrendingUp, CheckCircle, Circle, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal, Action, Milestone } from "@/app/page";
import { useToast } from "@/hooks/use-toast";
import { ExpandableAction } from "@/components/ExpandableAction";
import { ExpandableMilestone } from "@/components/ExpandableMilestone";

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
      impact: 10,
      subActions: []
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
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {goal.actions.map((action) => {
                      // Helper function to update an action
                      const handleUpdateAction = (actionId: string, updates: Partial<Action>) => {
                        const updatedActions = goal.actions.map(a =>
                          a.id === actionId ? { ...a, ...updates } : a
                        );
                        onUpdate({ actions: updatedActions });
                      };

                      return (
                        <ExpandableAction
                          key={action.id}
                          action={action}
                          goalContext={{
                            goalTitle: goal.title,
                            goalCategory: goal.category
                          }}
                          onUpdateAction={handleUpdateAction}
                        />
                      );
                    })}
                    
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
                  <div className="space-y-1">
                    {goal.milestones.map((milestone) => {
                      // Helper function to update a milestone
                      const handleUpdateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
                        const updatedMilestones = goal.milestones.map(m =>
                          m.id === milestoneId ? { ...m, ...updates } : m
                        );
                        onUpdate({ milestones: updatedMilestones });
                      };

                      return (
                        <ExpandableMilestone
                          key={milestone.id}
                          milestone={milestone}
                          goalContext={{
                            goalTitle: goal.title,
                            goalCategory: goal.category
                          }}
                          onUpdateMilestone={handleUpdateMilestone}
                        />
                      );
                    })}
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