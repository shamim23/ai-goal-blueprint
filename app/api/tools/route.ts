import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: tools, error } = await supabase
      .from('tools')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
    }

    if (tools && tools.length > 0) {
      return NextResponse.json({
        tools: tools[0].tools_data,
        lastUpdated: tools[0].updated_at,
        hasTools: true
      })
    } else {
      return NextResponse.json({
        tools: null,
        hasTools: false
      })
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tools, goals } = await request.json()

    // Check if user already has tools saved
    const { data: existingTools, error: fetchError } = await supabase
      .from('tools')
      .select('id')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to check existing tools' }, { status: 500 })
    }

    if (existingTools && existingTools.length > 0) {
      // Update existing tools
      const { data: updatedTools, error: updateError } = await supabase
        .from('tools')
        .update({
          tools_data: tools,
          goals_snapshot: goals
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Database update error:', updateError)
        return NextResponse.json({ error: 'Failed to update tools' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        tools: updatedTools.tools_data,
        action: 'updated'
      })
    } else {
      // Create new tools entry
      const { data: newTools, error: insertError } = await supabase
        .from('tools')
        .insert({
          user_id: user.id,
          tools_data: tools,
          goals_snapshot: goals
        })
        .select()
        .single()

      if (insertError) {
        console.error('Database insert error:', insertError)
        return NextResponse.json({ error: 'Failed to save tools' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        tools: newTools.tools_data,
        action: 'created'
      })
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Database delete error:', error)
      return NextResponse.json({ error: 'Failed to delete tools' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}