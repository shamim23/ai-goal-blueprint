'use client'

import { useState, useEffect } from "react";
import { Plus, Target, TrendingUp, Calendar, Zap, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalCard } from "@/components/GoalCard";
import { CreateGoalDialog } from "@/components/CreateGoalDialog";
import { StatsOverview } from "@/components/StatsOverview";
import { ActionLog } from "@/components/ActionLog";
import { AccountabilityHub } from "@/components/AccountabilityHub";
import { MindMapView } from "@/components/MindMapView";
import { NetworkGraphView } from "@/components/NetworkGraphView";
import { ToolsSection } from "@/components/ToolsSection";
import { EditGoalDialog } from "@/components/EditGoalDialog";
import { DeleteGoalDialog } from "@/components/DeleteGoalDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: "business" | "personal" | "health" | "learning";
  progress: number;
  target: number;
  deadline: string;
  actions: Action[];
  milestones: Milestone[];
}

export interface Action {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  impact: number;
  subActions?: Action[];
  level?: number;
  parentId?: string;
  isExpanded?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  actions?: Action[];
  isExpanded?: boolean;
}

export default function HomePage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  // Fetch goals from API
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/goals');
        if (response.ok) {
          const data = await response.json();
          setGoals(data.goals);
        } else {
          console.error('Failed to fetch goals:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const handleCreateGoal = async (newGoal: Omit<Goal, "id" | "progress" | "actions" | "milestones">) => {
    try {
      // First create the goal in the database
      const createResponse = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGoal),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create goal');
      }

      const { goal: createdGoal } = await createResponse.json();

      // Then enhance with AI
      try {
        const enhanceResponse = await fetch('/api/ai-enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ goal: newGoal, goalId: createdGoal.id }),
        });

        const enhancedData = await enhanceResponse.json();

        const goal: Goal = {
          ...createdGoal,
          actions: enhancedData.actions || [],
          milestones: enhancedData.milestones || []
        };

        setGoals(prev => [...prev, goal]);
        toast({
          title: "Goal Created with AI Enhancement! 🎯✨",
          description: `"${goal.title}" has been enhanced with AI-suggested actions and milestones.`,
        });
      } catch (enhanceError) {
        // Fallback to goal without AI enhancement
        const goal: Goal = {
          ...createdGoal,
          actions: [],
          milestones: []
        };
        setGoals(prev => [...prev, goal]);
        toast({
          title: "Goal Created! 🎯",
          description: `"${goal.title}" has been added to your goals.`,
        });
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal =>
      goal.id === goalId ? { ...goal, ...updates } : goal
    ));
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setDeletingGoal(goal);
  };

  const handleGoalUpdated = (goalId: string, updatedGoal: Goal) => {
    setGoals(prev => prev.map(goal =>
      goal.id === goalId ? updatedGoal : goal
    ));
    toast({
      title: "Goal Updated! ✅",
      description: `"${updatedGoal.title}" has been updated successfully.`,
    });
  };

  const handleGoalDeleted = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
    toast({
      title: "Goal Deleted! 🗑️",
      description: "Goal and all associated data have been removed.",
    });
  };

  const totalActions = goals.reduce((sum, goal) => sum + goal.actions.length, 0);
  const completedActions = goals.reduce((sum, goal) =>
    sum + goal.actions.filter(action => action.completed).length, 0
  );
  const averageProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Goal Tracker AI
            </h1>
            <p className="text-muted-foreground text-lg">
              Transform your ambitions into achievements with AI-powered insights
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 mt-4 md:mt-0"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Goal
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[750px] mx-auto">
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              My Goals
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Graph View
            </TabsTrigger>
            <TabsTrigger value="accountability" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Accountability
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-6">
            {/* Stats Overview */}
            <StatsOverview
              totalGoals={goals.length}
              averageProgress={averageProgress}
              totalActions={totalActions}
              completedActions={completedActions}
            />

            {/* Goals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {isLoading ? (
                // Loading state
                <Card className="bg-gradient-card border-border shadow-elegant">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading your goals...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {goals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={(updates) => handleUpdateGoal(goal.id, updates)}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                    />
                  ))}

                  {goals.length === 0 && (
                    <Card className="bg-gradient-card border-border shadow-elegant">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Target className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
                        <p className="text-muted-foreground text-center mb-6">
                          Create your first goal to start tracking your progress
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Goal
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* AI Insights & Action Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ActionLog goals={goals} onUpdateGoal={handleUpdateGoal} />
              </div>
              <div>
                <Card className="bg-gradient-card border-border shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-primary" />
                      AI Insights
                    </CardTitle>
                    <CardDescription>
                      Intelligent recommendations for your goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/20 border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-2">💡 Smart Suggestion</p>
                      <p className="text-sm text-muted-foreground">
                        Based on your progress, consider breaking down "Launch SaaS Product" into smaller weekly milestones for better momentum.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/20 border border-accent/20">
                      <p className="text-sm font-medium text-accent mb-2">🔥 Momentum Alert</p>
                      <p className="text-sm text-muted-foreground">
                        You've completed 67% of your actions this week! Keep this pace to hit your deadlines.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/20 border border-warning/20">
                      <p className="text-sm font-medium text-warning mb-2">⚡ Action Needed</p>
                      <p className="text-sm text-muted-foreground">
                        "Master AI & Machine Learning" needs attention. Consider scheduling dedicated time blocks.
                      </p>
                    </div>
                    <Button className="w-full" variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Get AI Analysis
                    </Button>
                    <div className="mt-3 p-3 rounded-lg bg-muted/10 border border-primary/10">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Pro Tip:</strong> AI enhancement is now active! New goals automatically get AI-suggested actions and milestones.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tools">
            <ToolsSection goals={goals} />
          </TabsContent>

          <TabsContent value="graph" className="space-y-6">
            <div className="space-y-8">
              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Mind Map View
                  </CardTitle>
                  <CardDescription>
                    Visual representation of your goals with central hub layout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MindMapView goals={goals} />
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Network Graph View
                  </CardTitle>
                  <CardDescription>
                    Hierarchical layout showing goals, actions, and relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NetworkGraphView goals={goals} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accountability">
            <AccountabilityHub />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle>Goal Progress Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                      <p>Advanced analytics coming soon!</p>
                      <p className="text-sm mt-2">Connect Supabase for detailed insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle>Accountability Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-4" />
                      <p>Track how accountability affects your success rate</p>
                      <p className="text-sm mt-2">Available with partner system</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <CreateGoalDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateGoal={handleCreateGoal}
        />

        {editingGoal && (
          <EditGoalDialog
            open={!!editingGoal}
            onOpenChange={(open) => !open && setEditingGoal(null)}
            goal={editingGoal}
            onUpdateGoal={handleGoalUpdated}
          />
        )}

        {deletingGoal && (
          <DeleteGoalDialog
            open={!!deletingGoal}
            onOpenChange={(open) => !open && setDeletingGoal(null)}
            goal={deletingGoal}
            onDeleteGoal={handleGoalDeleted}
          />
        )}
      </div>
    </div>
  );
}