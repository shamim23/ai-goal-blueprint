'use client'

import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Clock, Target, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Action } from "@/app/page";
import { TaskAnalysisModal } from "@/components/TaskAnalysisModal";

interface ExpandableActionProps {
  action: Action;
  goalContext?: {
    goalTitle: string;
    goalCategory: string;
  };
  onUpdateAction: (actionId: string, updates: Partial<Action>) => void;
  level?: number;
}

export function ExpandableAction({
  action,
  goalContext,
  onUpdateAction,
  level = 0
}: ExpandableActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const { toast } = useToast();

  const handleToggleComplete = () => {
    onUpdateAction(action.id, { completed: !action.completed });
  };

  const handleExpandAction = async () => {
    if (action.subActions && action.subActions.length > 0) {
      // Just toggle expansion if sub-actions already exist
      onUpdateAction(action.id, { isExpanded: !action.isExpanded });
      return;
    }

    // Generate sub-actions using AI
    setIsLoading(true);
    try {
      const response = await fetch('/api/breakdown-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          context: goalContext,
          level
        }),
      });

      const data = await response.json();

      if (data.subActions) {
        onUpdateAction(action.id, {
          subActions: data.subActions,
          isExpanded: true
        });

        toast({
          title: "Action Broken Down! 🎯",
          description: `Generated ${data.subActions.length} actionable steps with AI.`,
        });
      } else if (data.fallback) {
        onUpdateAction(action.id, {
          subActions: data.fallback.subActions,
          isExpanded: true
        });

        toast({
          title: "Action Broken Down! 📋",
          description: `Generated ${data.fallback.subActions.length} steps using smart suggestions.`,
        });
      }
    } catch (error) {
      console.error('Error breaking down action:', error);
      toast({
        title: "Error",
        description: "Failed to break down action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubAction = (subActionId: string, updates: Partial<Action>) => {
    if (!action.subActions) return;

    const updatedSubActions = action.subActions.map(subAction =>
      subAction.id === subActionId ? { ...subAction, ...updates } : subAction
    );

    onUpdateAction(action.id, { subActions: updatedSubActions });
  };

  const handleAnalyzeTask = async () => {
    const response = await fetch('/api/analyze-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: {
          title: action.title,
          type: 'action',
          impact: action.impact,
          date: action.date
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

  const indentLevel = level * 20;
  const maxLevel = 3; // Prevent infinite recursion

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
          action.completed
            ? 'bg-success/10 border-success/20'
            : 'bg-card border-border hover:border-primary/30'
        }`}
        style={{ marginLeft: `${indentLevel}px` }}
      >
        {/* Expand/Collapse Button */}
        {level < maxLevel && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
            onClick={handleExpandAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : action.isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            action.completed
              ? 'bg-success border-success text-success-foreground'
              : 'border-muted-foreground hover:border-primary'
          }`}
        >
          {action.completed && <span className="text-xs">✓</span>}
        </button>

        {/* Action Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-medium ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
              {action.title}
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                {action.impact}
              </Badge>
              {action.date && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {action.date}
                </Badge>
              )}
              {level > 0 && (
                <Badge variant="secondary" className="text-xs">
                  L{level}
                </Badge>
              )}
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
          {level < maxLevel && !action.subActions?.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAction}
              disabled={isLoading}
            >
              <Zap className="w-3 h-3 mr-1" />
              {isLoading ? 'Breaking down...' : 'Break Down'}
            </Button>
          )}
        </div>
      </div>

      {/* Sub-actions */}
      {action.isExpanded && action.subActions && action.subActions.length > 0 && (
        <div className="space-y-1">
          {action.subActions.map((subAction) => (
            <ExpandableAction
              key={subAction.id}
              action={subAction}
              goalContext={goalContext}
              onUpdateAction={(subActionId, updates) => updateSubAction(subActionId, updates)}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Task Analysis Modal */}
      <TaskAnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        taskTitle={action.title}
        taskType="action"
        onAnalyze={handleAnalyzeTask}
      />
    </div>
  );
}