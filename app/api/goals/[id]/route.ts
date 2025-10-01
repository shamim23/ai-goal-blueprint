import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, category, deadline, progress, target } = body

    // First verify the goal belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    if (existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update({
        title,
        description,
        category,
        deadline,
        progress: progress || 0,
        target: target || 100
      })
      .eq('id', params.id)
      .select(`
        *,
        actions:actions(*),
        milestones:milestones(*, milestone_actions(*))
      `)
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
    }

    // Transform database data to match frontend interface
    const transformedGoal = {
      ...updatedGoal,
      actions: updatedGoal.actions?.map((action: any) => ({
        ...action,
        level: action.level || 0,
        isExpanded: action.is_expanded || false,
        subActions: []
      })) || [],
      milestones: updatedGoal.milestones?.map((milestone: any) => ({
        ...milestone,
        isExpanded: milestone.is_expanded || false,
        actions: milestone.milestone_actions?.map((action: any) => ({
          ...action,
          level: action.level || 1,
          isExpanded: action.is_expanded || false,
          subActions: []
        })) || []
      })) || []
    }

    return NextResponse.json({ goal: transformedGoal })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // First verify the goal belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    if (existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the goal (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Goal and all associated data deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}