'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Goal } from '@/app/dashboard/page'

interface DeleteGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal
  onDeleteGoal: (goalId: string) => void
}

export function DeleteGoalDialog({ open, onOpenChange, goal, onDeleteGoal }: DeleteGoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleteGoal(goal.id)
        onOpenChange(false)
      } else {
        console.error('Failed to delete goal')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Goal
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>"{goal.title}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>The goal and its description</li>
              <li>All actions ({goal.actions?.length || 0} items)</li>
              <li>All milestones ({goal.milestones?.length || 0} items)</li>
              <li>All sub-actions and related data</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Goal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}