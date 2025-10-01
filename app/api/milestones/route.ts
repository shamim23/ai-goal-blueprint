import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { goalId, milestones } = body

    // Verify the goal belongs to the user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single()

    if (goalError || !goal || goal.user_id !== user.id) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 403 })
    }

    // Insert milestones and their actions
    const results = []

    for (const milestone of milestones) {
      // Insert milestone
      const { data: insertedMilestone, error: milestoneError } = await supabase
        .from('milestones')
        .insert({
          goal_id: goalId,
          title: milestone.title,
          completed: milestone.completed || false,
          date: milestone.date || null,
          is_expanded: milestone.isExpanded || false
        })
        .select()
        .single()

      if (milestoneError) {
        console.error('Milestone insert error:', milestoneError)
        continue
      }

      // Insert milestone actions if any
      let milestoneActions = []
      if (milestone.actions && milestone.actions.length > 0) {
        const actionsToInsert = milestone.actions.map((action: any) => ({
          milestone_id: insertedMilestone.id,
          title: action.title,
          completed: action.completed || false,
          date: action.date || new Date().toISOString().split('T')[0],
          impact: action.impact || 10,
          level: action.level || 1,
          parent_id: action.parentId || null,
          is_expanded: action.isExpanded || false
        }))

        const { data: insertedActions, error: actionsError } = await supabase
          .from('milestone_actions')
          .insert(actionsToInsert)
          .select()

        if (!actionsError) {
          milestoneActions = insertedActions || []
        }
      }

      results.push({
        ...insertedMilestone,
        actions: milestoneActions.map((action: any) => ({
          ...action,
          level: action.level || 1,
          isExpanded: action.is_expanded || false,
          parentId: action.parent_id,
          subActions: []
        }))
      })
    }

    return NextResponse.json({ milestones: results })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const goalId = searchParams.get('goalId')

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!goalId) {
    return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
  }

  try {
    // Verify the goal belongs to the user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single()

    if (goalError || !goal || goal.user_id !== user.id) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 403 })
    }

    // Fetch milestones with their actions
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select(`
        *,
        milestone_actions(*)
      `)
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true })

    if (milestonesError) {
      console.error('Database error:', milestonesError)
      return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
    }

    // Transform to frontend format
    const transformedMilestones = milestones?.map((milestone: any) => ({
      ...milestone,
      isExpanded: milestone.is_expanded || false,
      actions: milestone.milestone_actions?.map((action: any) => ({
        ...action,
        level: action.level || 1,
        isExpanded: action.is_expanded || false,
        parentId: action.parent_id,
        subActions: []
      })) || []
    })) || []

    return NextResponse.json({ milestones: transformedMilestones })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}