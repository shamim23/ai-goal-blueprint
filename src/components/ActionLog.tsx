import { useState } from "react";
import { Plus, Clock, CheckCircle, TrendingUp, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, Action } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface ActionLogProps {
  goals: Goal[];
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void;
}

export function ActionLog({ goals, onUpdateGoal }: ActionLogProps) {
  const { toast } = useToast();
  const [newActionTitle, setNewActionTitle] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");

  // Get all actions from all goals with goal context
  const allActions = goals.flatMap(goal => 
    goal.actions.map(action => ({
      ...action,
      goalId: goal.id,
      goalTitle: goal.title,
      goalCategory: goal.category
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredActions = allActions.filter(action => {
    if (filterStatus === "completed") return action.completed;
    if (filterStatus === "pending") return !action.completed;
    return true;
  });

  const handleAddQuickAction = () => {
    if (!newActionTitle.trim() || !selectedGoalId) return;

    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    const newAction: Action = {
      id: Date.now().toString(),
      title: newActionTitle,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      impact: 10
    };

    onUpdateGoal(selectedGoalId, {
      actions: [...goal.actions, newAction]
    });

    setNewActionTitle("");
    setSelectedGoalId("");
    
    toast({
      title: "Action Logged! ⚡",
      description: `"${newAction.title}" added to ${goal.title}`,
    });
  };

  const toggleActionComplete = (action: any) => {
    const goal = goals.find(g => g.id === action.goalId);
    if (!goal) return;

    const updatedActions = goal.actions.map(a =>
      a.id === action.id ? { ...a, completed: !a.completed } : a
    );
    
    const completedCount = updatedActions.filter(a => a.completed).length;
    const newProgress = Math.round((completedCount / updatedActions.length) * 100);

    onUpdateGoal(action.goalId, {
      actions: updatedActions,
      progress: newProgress || 0
    });

    toast({
      title: action.completed ? "Action Undone" : "Action Completed! 🎉",
      description: `Progress updated for ${goal.title}`,
    });
  };

  const categoryColors = {
    business: "bg-gradient-primary",
    personal: "bg-gradient-success", 
    health: "bg-red-500",
    learning: "bg-blue-500"
  };

  return (
    <Card className="bg-gradient-card border-border shadow-elegant">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Action Log
            </CardTitle>
            <CardDescription>
              Track your daily actions and progress across all goals
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Add Action */}
        <div className="flex gap-2">
          <Input
            placeholder="Log a new action..."
            value={newActionTitle}
            onChange={(e) => setNewActionTitle(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddQuickAction} disabled={!newActionTitle.trim() || !selectedGoalId}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredActions.map((action) => (
            <div
              key={`${action.goalId}-${action.id}`}
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <button
                onClick={() => toggleActionComplete(action)}
                className="flex-shrink-0"
              >
                {action.completed ? (
                  <CheckCircle className="w-5 h-5 text-accent" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground hover:border-primary transition-colors" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-medium ${action.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {action.title}
                  </p>
                  <Badge 
                    className={`text-xs ${categoryColors[action.goalCategory]} text-white`}
                    variant="secondary"
                  >
                    {action.goalTitle}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{action.date}</span>
                  <span>Impact: +{action.impact} pts</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-accent font-medium">+{action.impact}</span>
              </div>
            </div>
          ))}
          
          {filteredActions.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filterStatus === "all" 
                  ? "No actions logged yet. Start by adding your first action above!"
                  : `No ${filterStatus} actions found.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Action Insights */}
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {allActions.filter(a => a.completed).length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                {allActions.filter(a => !a.completed).length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">
                {allActions.reduce((sum, a) => sum + (a.completed ? a.impact : 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Impact</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}