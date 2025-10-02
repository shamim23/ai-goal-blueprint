'use client'

import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Clock, Target, Loader2, Brain, Timer, StickyNote, Plus, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Action } from "@/app/dashboard/page";
import { TaskAnalysisModal } from "@/components/TaskAnalysisModal";

interface ExpandableActionProps {
  action: Action;
  goalContext?: {
    goalTitle: string;
    goalCategory: string;
  };
  goalId?: string;
  onUpdateAction: (actionId: string, updates: Partial<Action>) => void;
  level?: number;
}

export function ExpandableAction({
  action,
  goalContext,
  goalId,
  onUpdateAction,
  level = 0
}: ExpandableActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [isGeneratingTime, setIsGeneratingTime] = useState(false);
  const [notes, setNotes] = useState(action.notes || "");
  const { toast } = useToast();

  const handleToggleComplete = () => {
    onUpdateAction(action.id, { completed: !action.completed });
  };

  const handleExpandAction = async () => {
    console.log('handleExpandAction called for:', action.title)
    console.log('Current subActions:', action.subActions)
    console.log('subActions length:', action.subActions?.length)

    if (action.subActions && action.subActions.length > 0) {
      // Just toggle expansion if sub-actions already exist
      console.log('Toggling expansion for existing subActions')
      onUpdateAction(action.id, { isExpanded: !action.isExpanded });
      return;
    }

    // Generate sub-actions using AI
    console.log('No subActions found, generating new ones')
    console.log('goalId:', goalId)
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
          level,
          goalId
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

    const updateRecursively = (actions: Action[]): Action[] => {
      return actions.map(subAction => {
        if (subAction.id === subActionId) {
          return { ...subAction, ...updates };
        }
        if (subAction.subActions && subAction.subActions.length > 0) {
          return {
            ...subAction,
            subActions: updateRecursively(subAction.subActions)
          };
        }
        return subAction;
      });
    };

    const updatedSubActions = updateRecursively(action.subActions);
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

  const handleGenerateTime = async () => {
    setIsGeneratingTime(true);
    try {
      const response = await fetch('/api/estimate-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: {
            id: action.id,
            title: action.title,
            impact: action.impact,
            notes: action.notes
          },
          context: goalContext,
          level
        }),
      });

      const data = await response.json();

      if (data.estimatedTime) {
        onUpdateAction(action.id, {
          estimatedTime: data.estimatedTime,
          timeGenerated: true
        });

        toast({
          title: "Time Estimated! ⏱️",
          description: `Estimated ${formatTime(data.estimatedTime)} for "${action.title}"`,
        });
      }
    } catch (error) {
      console.error('Error estimating time:', error);
      toast({
        title: "Error",
        description: "Failed to estimate time. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTime(false);
    }
  };

  const handleSaveNotes = () => {
    onUpdateAction(action.id, { notes });
    setShowNotesDialog(false);
    toast({
      title: "Notes Saved! 📝",
      description: `Notes updated for "${action.title}"`,
    });
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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
              {action.estimatedTime && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Timer className="w-3 h-3 mr-1" />
                  {formatTime(action.estimatedTime)}
                </Badge>
              )}
              {action.notes && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <StickyNote className="w-3 h-3 mr-1" />
                  Notes
                </Badge>
              )}
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
        <div className="flex gap-1 ml-2">
          {/* Time Estimation Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateTime}
            disabled={isGeneratingTime}
            className="text-blue-600 hover:text-blue-700 px-2"
            title="Generate time estimate"
          >
            {isGeneratingTime ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Timer className="w-3 h-3" />
            )}
          </Button>

          {/* Notes Button */}
          <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 px-2"
                title="Add/edit notes"
              >
                <StickyNote className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Notes for "{action.title}"</DialogTitle>
                <DialogDescription>
                  Add notes, comments, or additional details for this task.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNotesDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNotes}>
                    Save Notes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Analyze Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalysisModal(true)}
            className="text-purple-600 hover:text-purple-700 px-2"
            title="Analyze task"
          >
            <Brain className="w-3 h-3" />
          </Button>

          {/* AI Breakdown Button */}
          {level < maxLevel && !action.subActions?.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAction}
              disabled={isLoading}
              title="Break down into subtasks"
            >
              <Zap className="w-3 h-3 mr-1" />
              {isLoading ? 'Breaking...' : 'Break Down'}
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
              goalId={goalId}
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