import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { goal, goalId } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI key, using fallback');
      const enhancedData = generateSmartSuggestions(goal);
      if (goalId) {
        await saveToDatabase(goalId, enhancedData);
      }
      return NextResponse.json(enhancedData);
    }

    // Use OpenAI to enhance the goal
    const enhancedData = await enhanceGoalWithOpenAI(goal);
    if (goalId) {
      await saveToDatabase(goalId, enhancedData);
    }
    return NextResponse.json(enhancedData);

  } catch (error) {
    console.error('AI Enhancement Error:', error);

    // Fallback to rule-based suggestions
    const enhancedData = generateSmartSuggestions(goal);
    if (goalId) {
      await saveToDatabase(goalId, enhancedData);
    }
    return NextResponse.json(enhancedData);
  }
}

async function enhanceGoalWithOpenAI(goal: any) {
  const prompt = `
You are an expert productivity coach and goal-setting assistant. Enhance this goal with intelligent suggestions.

Goal Details:
- Title: "${goal.title}"
- Description: "${goal.description}"
- Category: "${goal.category}"
- Deadline: "${goal.deadline}"

Please provide:
1. 3-5 specific, actionable steps to achieve this goal
2. 3-4 meaningful milestones with realistic dates
3. A brief AI insight about the goal

Requirements:
- Actions should be specific and measurable
- Include estimated impact scores (1-30)
- Milestones should be evenly distributed before the deadline
- Consider the goal category for specialized advice

Respond with a JSON object in this exact format:
{
  "actions": [
    {
      "title": "Specific action step",
      "impact": 25,
      "category": "research|planning|execution|outreach|analysis"
    }
  ],
  "milestones": [
    {
      "title": "Milestone name",
      "description": "What this represents",
      "targetDate": "YYYY-MM-DD"
    }
  ],
  "aiInsight": "Personalized insight about achieving this goal"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a productivity expert who provides actionable goal enhancement. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const responseText = completion.choices[0].message.content;

  if (!responseText) {
    throw new Error('No response from OpenAI');
  }

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', responseText);
    throw new Error('Invalid JSON response from AI');
  }

  // Transform the response to match our expected format
  const today = new Date();
  const deadline = new Date(goal.deadline);

  const actions = parsedResponse.actions.map((action: any, index: number) => ({
    id: `ai-${Date.now()}-${index}`,
    title: action.title,
    completed: false,
    date: new Date(today.getTime() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    impact: action.impact || 20,
    subActions: [] // Initialize for recursive breakdown
  }));

  const milestones = parsedResponse.milestones.map((milestone: any, index: number) => ({
    id: `ai-milestone-${Date.now()}-${index}`,
    title: milestone.title,
    completed: false,
    date: milestone.targetDate || new Date(today.getTime() + (index + 1) * 4 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));

  return {
    actions,
    milestones,
    aiInsight: parsedResponse.aiInsight || `AI-enhanced plan for your ${goal.category} goal "${goal.title}".`
  };
}

function generateSmartSuggestions(goal: any) {
  const { title, description, category, deadline } = goal;

  // Smart action suggestions based on category
  const actionSuggestions = {
    business: [
      { title: "Conduct market research", impact: 20 },
      { title: "Create detailed project plan", impact: 25 },
      { title: "Set up tracking metrics", impact: 15 },
      { title: "Identify key stakeholders", impact: 20 },
      { title: "Develop MVP or prototype", impact: 30 }
    ],
    learning: [
      { title: "Set daily study schedule", impact: 25 },
      { title: "Find online courses or resources", impact: 20 },
      { title: "Join relevant communities", impact: 15 },
      { title: "Practice with hands-on projects", impact: 30 },
      { title: "Take progress assessments", impact: 15 }
    ],
    health: [
      { title: "Consult with healthcare professional", impact: 25 },
      { title: "Create workout routine", impact: 30 },
      { title: "Plan nutrition strategy", impact: 25 },
      { title: "Set up progress tracking", impact: 15 },
      { title: "Find accountability partner", impact: 20 }
    ],
    personal: [
      { title: "Define specific outcomes", impact: 20 },
      { title: "Break down into weekly goals", impact: 25 },
      { title: "Identify potential obstacles", impact: 15 },
      { title: "Create reward system", impact: 10 },
      { title: "Schedule regular check-ins", impact: 20 }
    ]
  };

  // Smart milestone suggestions
  const milestoneSuggestions = {
    business: [
      { title: "Complete initial planning phase", weeks: 2 },
      { title: "Achieve first major deliverable", weeks: 6 },
      { title: "Reach 50% completion", weeks: 12 },
      { title: "Final review and optimization", weeks: 20 },
    ],
    learning: [
      { title: "Complete foundational materials", weeks: 4 },
      { title: "Finish first practical project", weeks: 8 },
      { title: "Pass intermediate assessment", weeks: 12 },
      { title: "Demonstrate mastery", weeks: 16 },
    ],
    health: [
      { title: "Establish baseline measurements", weeks: 1 },
      { title: "See initial improvements", weeks: 4 },
      { title: "Reach halfway point", weeks: 12 },
      { title: "Achieve target goal", weeks: 24 },
    ],
    personal: [
      { title: "Set up systems and habits", weeks: 2 },
      { title: "Show consistent progress", weeks: 6 },
      { title: "Overcome major challenges", weeks: 12 },
      { title: "Achieve desired outcome", weeks: 20 },
    ]
  };

  // Calculate dates for milestones based on deadline
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const totalWeeks = Math.floor((deadlineDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));

  const actions = (actionSuggestions[category as keyof typeof actionSuggestions] || actionSuggestions.personal)
    .slice(0, 3) // Take first 3 suggestions
    .map((action, index) => ({
      id: `ai-${Date.now()}-${index}`,
      title: action.title,
      completed: false,
      date: new Date(today.getTime() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      impact: action.impact
    }));

  const milestones = (milestoneSuggestions[category as keyof typeof milestoneSuggestions] || milestoneSuggestions.personal)
    .filter(milestone => milestone.weeks <= totalWeeks) // Only include milestones that fit within the deadline
    .map((milestone, index) => ({
      id: `ai-milestone-${Date.now()}-${index}`,
      title: milestone.title,
      completed: false,
      date: new Date(today.getTime() + milestone.weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));

  return {
    actions,
    milestones,
    aiInsight: `Based on your ${category} goal "${title}", I've suggested ${actions.length} actionable steps and ${milestones.length} key milestones to help you succeed.`
  };
}

async function saveToDatabase(goalId: string, enhancedData: any) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Get user from request
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('No user found for saving enhanced data');
      return;
    }

    // Verify goal belongs to user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (goalError || !goal || goal.user_id !== user.id) {
      console.error('Goal not found or unauthorized');
      return;
    }

    // Save actions if any
    if (enhancedData.actions && enhancedData.actions.length > 0) {
      const actionsToInsert = enhancedData.actions.map((action: any) => ({
        goal_id: goalId,
        title: action.title,
        completed: action.completed || false,
        date: action.date || new Date().toISOString().split('T')[0],
        impact: action.impact || 10,
        level: action.level || 0,
        parent_id: action.parentId || null,
        is_expanded: action.isExpanded || false
      }));

      const { error: actionsError } = await supabase
        .from('actions')
        .insert(actionsToInsert);

      if (actionsError) {
        console.error('Error saving actions:', actionsError);
      }
    }

    // Save milestones if any
    if (enhancedData.milestones && enhancedData.milestones.length > 0) {
      for (const milestone of enhancedData.milestones) {
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
          .single();

        if (milestoneError) {
          console.error('Error saving milestone:', milestoneError);
          continue;
        }

        // Save milestone actions if any
        if (milestone.actions && milestone.actions.length > 0) {
          const milestoneActionsToInsert = milestone.actions.map((action: any) => ({
            milestone_id: insertedMilestone.id,
            title: action.title,
            completed: action.completed || false,
            date: action.date || new Date().toISOString().split('T')[0],
            impact: action.impact || 10,
            level: action.level || 1,
            parent_id: action.parentId || null,
            is_expanded: action.isExpanded || false
          }));

          const { error: milestoneActionsError } = await supabase
            .from('milestone_actions')
            .insert(milestoneActionsToInsert);

          if (milestoneActionsError) {
            console.error('Error saving milestone actions:', milestoneActionsError);
          }
        }
      }
    }

    console.log('Successfully saved enhanced data to database');
  } catch (error) {
    console.error('Error in saveToDatabase:', error);
  }
}