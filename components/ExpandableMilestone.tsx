'use client'

import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Calendar, Target, Loader2, Flag, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Milestone, Action } from "@/app/page";
import { ExpandableAction } from "@/components/ExpandableAction";
import { TaskAnalysisModal } from "@/components/TaskAnalysisModal";

interface ExpandableMilestoneProps {
  milestone: Milestone;
  goalContext?: {
    goalTitle: string;
    goalCategory: string;
  };
  goalId?: string;
  onUpdateMilestone: (milestoneId: string, updates: Partial<Milestone>) => void;
}

export function ExpandableMilestone({
  milestone,
  goalContext,
  goalId,
  onUpdateMilestone
}: ExpandableMilestoneProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const { toast } = useToast();

  const handleToggleComplete = () => {
    onUpdateMilestone(milestone.id, { completed: !milestone.completed });
  };

  const handleExpandMilestone = async () => {
    if (milestone.subActions && milestone.subActions.length > 0) {
      // Just toggle expansion if sub-actions already exist
      onUpdateMilestone(milestone.id, { isExpanded: !milestone.isExpanded });
      return;
    }

    // Generate sub-actions using AI for the milestone
    setIsLoading(true);
    try {
      const response = await fetch('/api/breakdown-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: {
            id: milestone.id,
            title: `Achieve milestone: ${milestone.title}`,
            completed: milestone.completed,
            date: milestone.date,
            impact: 25 // Default impact for milestones
          },
          context: goalContext,
          level: 0 // Milestones start at level 0
        }),
      });

      const data = await response.json();

      if (data.subActions) {
        // Convert sub-actions to actions format
        const actions = data.subActions.map((subAction: any) => ({
          ...subAction,
          id: `milestone-${milestone.id}-${subAction.id}`,
          subActions: []
        }));

        onUpdateMilestone(milestone.id, {
          subActions: actions,
          isExpanded: true
        });

        toast({
          title: "Milestone Broken Down! 🎯",
          description: `Generated ${actions.length} actionable steps to achieve this milestone.`,
        });
      } else if (data.fallback) {
        const actions = data.fallback.subActions.map((subAction: any) => ({
          ...subAction,
          id: `milestone-${milestone.id}-${subAction.id}`,
          subActions: []
        }));

        onUpdateMilestone(milestone.id, {
          subActions: actions,
          isExpanded: true
        });

        toast({
          title: "Milestone Broken Down! 📋",
          description: `Generated ${actions.length} steps using smart suggestions.`,
        });
      }
    } catch (error) {
      console.error('Error breaking down milestone:', error);
      toast({
        title: "Error",
        description: "Failed to break down milestone. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubAction = (subActionId: string, updates: Partial<Action>) => {
    if (!milestone.subActions) return;

    const updatedSubActions = milestone.subActions.map(subAction =>
      subAction.id === subActionId ? { ...subAction, ...updates } : subAction
    );

    onUpdateMilestone(milestone.id, { subActions: updatedSubActions });
  };

  const handleAnalyzeTask = async () => {
    const response = await fetch('/api/analyze-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: {
          title: milestone.title,
          type: 'milestone',
          date: milestone.date
        },
        context: goalContext,
        userGoals: [] // Could be passed from parent component if needed
      }),
    });

    const data = await response.json();

    if (data.error && data.fallback) {
      return data.fallback;
    }

    return data;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6"
          onClick={handleExpandMilestone}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : milestone.isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        {/* Milestone Icon */}
        <Flag className="w-4 h-4 text-primary flex-shrink-0" />

        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            milestone.completed
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground hover:border-primary'
          }`}
        >
          {milestone.completed && <span className="text-xs">✓</span>}
        </button>

        {/* Milestone Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-medium ${milestone.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {milestone.title}
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs bg-primary/10">
                <Calendar className="w-3 h-3 mr-1" />
                {milestone.date}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Milestone
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-2">
          {/* Analyze Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalysisModal(true)}
            className="text-primary hover:text-primary"
          >
            <Brain className="w-3 h-3 mr-1" />
            Analyze
          </Button>

          {/* AI Breakdown Button */}
          {!milestone.subActions?.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandMilestone}
              disabled={isLoading}
            >
              <Zap className="w-3 h-3 mr-1" />
              {isLoading ? 'Breaking down...' : 'Break Down'}
            </Button>
          )}
        </div>
      </div>

      {/* Sub-actions */}
      {milestone.isExpanded && milestone.subActions && milestone.subActions.length > 0 && (
        <div className="ml-8 space-y-1">
          {milestone.subActions.map((subAction) => (
            <ExpandableAction
              key={subAction.id}
              action={subAction}
              goalContext={goalContext}
              goalId={goalId}
              onUpdateAction={(subActionId, updates) => updateSubAction(subActionId, updates)}
              level={1}
            />
          ))}
        </div>
      )}

      {/* Task Analysis Modal */}
      <TaskAnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        taskTitle={milestone.title}
        taskType="milestone"
        onAnalyze={handleAnalyzeTask}
      />
    </div>
  );
}