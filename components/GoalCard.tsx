import { useState } from "react";
import { Target, Calendar, TrendingUp, CheckCircle, Circle, Plus, Edit, Trash2, MoreVertical, Timer, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal, Action, Milestone } from "@/app/dashboard/page";
import { useToast } from "@/hooks/use-toast";
import { ExpandableAction } from "@/components/ExpandableAction";
import { ExpandableMilestone } from "@/components/ExpandableMilestone";

interface GoalCardProps {
  goal: Goal;
  onUpdate: (updates: Partial<Goal>) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
}

const categoryColors = {
  business: "bg-gradient-primary",
  personal: "bg-gradient-success", 
  health: "bg-red-500",
  learning: "bg-blue-500"
};

export function GoalCard({ goal, onUpdate, onEdit, onDelete }: GoalCardProps) {
  const { toast } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [isGeneratingAllTimes, setIsGeneratingAllTimes] = useState(false);

  const daysUntilDeadline = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleAddAction = async () => {
    if (!newActionTitle.trim()) return;

    const newAction: Action = {
      id: Date.now().toString(),
      title: newActionTitle,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      impact: 10,
      subActions: []
    };

    const updatedActions = [...goal.actions, newAction];

    // Optimistically update UI
    onUpdate({
      actions: updatedActions
    });

    // Save to database
    try {
      await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          actions: updatedActions
        }),
      });
    } catch (error) {
      console.error('Error saving action:', error);
      toast({
        title: "Warning",
        description: "Action added locally but failed to save to database.",
        variant: "destructive"
      });
    }

    setNewActionTitle("");
    toast({
      title: "Action Added! ✅",
      description: `"${newAction.title}" added to ${goal.title}`,
    });
  };

  const toggleAction = async (actionId: string) => {
    const updatedActions = goal.actions.map(action =>
      action.id === actionId ? { ...action, completed: !action.completed } : action
    );

    const completedCount = updatedActions.filter(a => a.completed).length;
    const newProgress = Math.round((completedCount / updatedActions.length) * 100);

    // Optimistically update UI
    onUpdate({
      actions: updatedActions,
      progress: newProgress || 0
    });

    // Save to database
    try {
      await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          actions: updatedActions
        }),
      });
    } catch (error) {
      console.error('Error saving action:', error);
    }

    toast({
      title: "Progress Updated! 🎯",
      description: `${goal.title} is now ${newProgress}% complete`,
    });
  };

  const handleGenerateAllTimes = async () => {
    setIsGeneratingAllTimes(true);
    try {
      const generateTimeForAction = async (action: Action, level: number = 0): Promise<Action> => {
        if (action.estimatedTime) {
          // If already has time, just process sub-actions
          if (action.subActions) {
            const updatedSubActions = await Promise.all(
              action.subActions.map(subAction => generateTimeForAction(subAction, level + 1))
            );
            return { ...action, subActions: updatedSubActions };
          }
          return action;
        }

        try {
          const response = await fetch('/api/estimate-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: {
                id: action.id,
                title: action.title,
                impact: action.impact,
                notes: action.notes
              },
              context: {
                goalTitle: goal.title,
                goalCategory: goal.category
              },
              level
            }),
          });

          const data = await response.json();
          let updatedAction = { ...action };

          if (data.estimatedTime) {
            updatedAction = {
              ...action,
              estimatedTime: data.estimatedTime,
              timeGenerated: true
            };
          }

          // Process sub-actions recursively
          if (action.subActions) {
            const updatedSubActions = await Promise.all(
              action.subActions.map(subAction => generateTimeForAction(subAction, level + 1))
            );
            updatedAction = { ...updatedAction, subActions: updatedSubActions };
          }

          return updatedAction;
        } catch (error) {
          console.error(`Error estimating time for ${action.title}:`, error);
          return action;
        }
      };

      const updatedActions = await Promise.all(
        goal.actions.map(action => generateTimeForAction(action))
      );

      const totalEstimatedTime = calculateTotalTime(updatedActions);

      onUpdate({ actions: updatedActions });

      toast({
        title: "All Times Generated! ⏱️",
        description: `Total estimated time: ${formatTime(totalEstimatedTime)}`,
      });
    } catch (error) {
      console.error('Error generating all times:', error);
      toast({
        title: "Error",
        description: "Failed to generate some time estimates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAllTimes(false);
    }
  };

  const calculateTotalTime = (actions: Action[]): number => {
    return actions.reduce((total, action) => {
      let actionTotal = action.estimatedTime || 0;
      if (action.subActions) {
        actionTotal += calculateTotalTime(action.subActions);
      }
      return total + actionTotal;
    }, 0);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(goal)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Goal
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(goal)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Goal
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateAllTimes}
                        disabled={isGeneratingAllTimes}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {isGeneratingAllTimes ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Timer className="w-4 h-4 mr-2" />
                            Generate All Times
                          </>
                        )}
                      </Button>
                      <Input
                        placeholder="Add new action..."
                        value={newActionTitle}
                        onChange={(e) => setNewActionTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
                        className="w-48"
                      />
                      <Button size="sm" onClick={handleAddAction}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {goal.actions.map((action) => {
                      // Helper function to recursively update an action or subaction
                      const updateActionRecursively = (actions: Action[], actionId: string, updates: Partial<Action>): Action[] => {
                        return actions.map(a => {
                          if (a.id === actionId) {
                            return { ...a, ...updates };
                          }
                          if (a.subActions && a.subActions.length > 0) {
                            return {
                              ...a,
                              subActions: updateActionRecursively(a.subActions, actionId, updates)
                            };
                          }
                          return a;
                        });
                      };

                      // Helper function to update an action
                      const handleUpdateAction = async (actionId: string, updates: Partial<Action>) => {
                        const updatedActions = updateActionRecursively(goal.actions, actionId, updates);

                        // Optimistically update UI
                        onUpdate({ actions: updatedActions });

                        // Save to database
                        try {
                          await fetch('/api/actions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              goalId: goal.id,
                              actions: updatedActions
                            }),
                          });
                        } catch (error) {
                          console.error('Error saving action updates:', error);
                        }
                      };

                      return (
                        <ExpandableAction
                          key={action.id}
                          action={action}
                          goalContext={{
                            goalTitle: goal.title,
                            goalCategory: goal.category
                          }}
                          goalId={goal.id}
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
                          goalId={goal.id}
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