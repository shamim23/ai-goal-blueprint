import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper function to recursively save actions and subactions
async function saveActionsRecursively(
  supabase: any,
  goalId: string,
  actions: any[],
  parentId: string | null
): Promise<any[]> {
  const savedActions = []

  console.log(`Saving ${actions.length} actions with parentId: ${parentId}`)

  for (const action of actions) {
    const actionData = {
      goal_id: goalId,
      parent_id: parentId,
      title: action.title,
      completed: action.completed || false,
      date: action.date,
      impact: action.impact || 10,
      level: action.level || 0,
      is_expanded: action.isExpanded || false,
      notes: action.notes || null,
      estimated_time: action.estimatedTime || null,
      actual_time: action.actualTime || null,
      time_generated: action.timeGenerated || false
    }

    console.log(`Processing action: ${action.title}, has subActions: ${action.subActions?.length || 0}`)

    let savedAction

    // Check if action already exists (has a valid UUID)
    if (action.id && action.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Update existing action
      const { data, error } = await supabase
        .from('actions')
        .update(actionData)
        .eq('id', action.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating action:', error)
        continue
      }
      savedAction = data
    } else {
      // Create new action
      const { data, error } = await supabase
        .from('actions')
        .insert(actionData)
        .select()
        .single()

      if (error) {
        console.error('Error creating action:', error)
        continue
      }
      savedAction = data
    }

    // Recursively save subactions
    let subActions = []
    if (action.subActions && action.subActions.length > 0) {
      subActions = await saveActionsRecursively(
        supabase,
        goalId,
        action.subActions,
        savedAction.id
      )
    }

    savedActions.push({
      ...savedAction,
      subActions
    })
  }

  return savedActions
}

// Create or update actions (including subactions)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { goalId, actions } = body

    // Verify the goal belongs to the user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single()

    if (goalError || !goal || goal.user_id !== user.id) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 403 })
    }

    // Save all actions recursively
    const savedActions = await saveActionsRecursively(supabase, goalId, actions, null)

    return NextResponse.json({ success: true, actions: savedActions })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to build action tree with subactions
function buildActionTree(actions: any[]): any[] {
  const actionMap = new Map()
  const rootActions: any[] = []

  // First pass: create all action objects
  actions.forEach(action => {
    actionMap.set(action.id, {
      ...action,
      level: action.level || 0,
      isExpanded: action.is_expanded || false,
      parentId: action.parent_id,
      estimatedTime: action.estimated_time,
      actualTime: action.actual_time,
      timeGenerated: action.time_generated,
      subActions: []
    })
  })

  // Second pass: build tree structure
  actionMap.forEach(action => {
    if (action.parentId) {
      const parent = actionMap.get(action.parentId)
      if (parent) {
        parent.subActions.push(action)
      }
    } else {
      rootActions.push(action)
    }
  })

  return rootActions
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

    // Fetch all actions for the goal (including subactions)
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true })

    if (actionsError) {
      console.error('Database error:', actionsError)
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 })
    }

    // Build tree structure
    const actionTree = buildActionTree(actions || [])

    return NextResponse.json({ actions: actionTree })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update a single action
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { actionId, updates } = body

    // Verify the action belongs to the user
    const { data: existingAction, error: fetchError } = await supabase
      .from('actions')
      .select('goal_id, goals!inner(user_id)')
      .eq('id', actionId)
      .single()

    if (fetchError || !existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    if (existingAction.goals.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the action
    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.completed !== undefined) updateData.completed = updates.completed
    if (updates.date !== undefined) updateData.date = updates.date
    if (updates.impact !== undefined) updateData.impact = updates.impact
    if (updates.level !== undefined) updateData.level = updates.level
    if (updates.isExpanded !== undefined) updateData.is_expanded = updates.isExpanded
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.estimatedTime !== undefined) updateData.estimated_time = updates.estimatedTime
    if (updates.actualTime !== undefined) updateData.actual_time = updates.actualTime
    if (updates.timeGenerated !== undefined) updateData.time_generated = updates.timeGenerated

    const { data: updatedAction, error: updateError } = await supabase
      .from('actions')
      .update(updateData)
      .eq('id', actionId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update action' }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: updatedAction })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}