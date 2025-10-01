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

    // Prepare actions for insertion
    const actionsToInsert = actions.map((action: any) => ({
      goal_id: goalId,
      title: action.title,
      completed: action.completed || false,
      date: action.date || new Date().toISOString().split('T')[0],
      impact: action.impact || 10,
      level: action.level || 0,
      parent_id: action.parentId || null,
      is_expanded: action.isExpanded || false
    }))

    // Insert actions into database
    const { data: insertedActions, error: insertError } = await supabase
      .from('actions')
      .insert(actionsToInsert)
      .select()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json({ error: 'Failed to save actions' }, { status: 500 })
    }

    return NextResponse.json({ actions: insertedActions })
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

    // Fetch actions for the goal
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true })

    if (actionsError) {
      console.error('Database error:', actionsError)
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 })
    }

    // Transform to frontend format
    const transformedActions = actions?.map((action: any) => ({
      ...action,
      level: action.level || 0,
      isExpanded: action.is_expanded || false,
      parentId: action.parent_id,
      subActions: []
    })) || []

    return NextResponse.json({ actions: transformedActions })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}