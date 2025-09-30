import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if this is the test user (using environment variable for demo)
  const testUserEmail = process.env.TEST_USER_EMAIL || 'test@example.com'
  const isTestUser = user.email === testUserEmail

  if (isTestUser) {
    // Return hardcoded goals for test user
    return NextResponse.json({
      goals: [
        {
          id: 'test-1',
          title: 'Launch EdTech Startup',
          description: 'Create an innovative educational technology platform that revolutionizes online learning',
          category: 'business',
          progress: 35,
          target: 100,
          deadline: '2024-12-31',
          actions: [
            {
              id: 'action-1',
              title: 'Conduct market research on existing EdTech solutions',
              completed: true,
              date: '2024-01-15',
              impact: 25,
              level: 0,
              isExpanded: false
            },
            {
              id: 'action-2',
              title: 'Develop MVP prototype',
              completed: false,
              date: '2024-02-28',
              impact: 40,
              level: 0,
              isExpanded: false
            },
            {
              id: 'action-3',
              title: 'Secure initial funding round',
              completed: false,
              date: '2024-04-30',
              impact: 35,
              level: 0,
              isExpanded: false
            }
          ],
          milestones: [
            {
              id: 'milestone-1',
              title: 'Complete Product Design',
              completed: true,
              date: '2024-01-31',
              isExpanded: false,
              actions: []
            },
            {
              id: 'milestone-2',
              title: 'Beta Launch',
              completed: false,
              date: '2024-06-15',
              isExpanded: false,
              actions: []
            }
          ]
        },
        {
          id: 'test-2',
          title: 'Master Machine Learning',
          description: 'Become proficient in ML algorithms and deep learning frameworks',
          category: 'learning',
          progress: 60,
          target: 100,
          deadline: '2024-08-15',
          actions: [
            {
              id: 'action-4',
              title: 'Complete Andrew Ng\'s ML Course',
              completed: true,
              date: '2024-01-20',
              impact: 30,
              level: 0,
              isExpanded: false
            },
            {
              id: 'action-5',
              title: 'Build 3 ML projects',
              completed: false,
              date: '2024-03-15',
              impact: 40,
              level: 0,
              isExpanded: false
            }
          ],
          milestones: []
        }
      ]
    })
  }

  // For real users, fetch from database
  try {
    const { data: goals, error } = await supabase
      .from('goals')
      .select(`
        *,
        actions:actions(*),
        milestones:milestones(*, milestone_actions(*))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    // Transform database data to match frontend interface
    const transformedGoals = goals?.map((goal: any) => ({
      ...goal,
      actions: goal.actions?.map((action: any) => ({
        ...action,
        level: action.level || 0,
        isExpanded: action.is_expanded || false,
        subActions: []
      })) || [],
      milestones: goal.milestones?.map((milestone: any) => ({
        ...milestone,
        isExpanded: milestone.is_expanded || false,
        actions: milestone.milestone_actions?.map((action: any) => ({
          ...action,
          level: action.level || 1,
          isExpanded: action.is_expanded || false,
          subActions: []
        })) || []
      })) || []
    })) || []

    return NextResponse.json({ goals: transformedGoals })
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
    const body = await request.json()
    const { title, description, category, deadline } = body

    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        deadline,
        progress: 0,
        target: 100
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}