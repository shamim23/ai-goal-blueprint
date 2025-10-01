import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { action, context, level = 0, goalId, milestoneId } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        fallback: generateFallbackBreakdown(action, level)
      }, { status: 200 });
    }

    // Create a detailed prompt for breaking down the action
    const prompt = `
You are an expert productivity coach specializing in task decomposition. Break down this action into 3-5 very specific, actionable micro-tasks.

CONTEXT:
${context ? `Goal: "${context.goalTitle}" (${context.goalCategory})` : ''}
Action to break down: "${action.title}"
Breakdown level: ${level} (0 = main action, 1+ = sub-actions, 2+ = micro-tasks)

INSTRUCTIONS:
${level === 0 ? `
- Break this main action into logical phases/components
- Each step should be a distinct workstream that could take 30-120 minutes
- Focus on major deliverables and key activities
` : level === 1 ? `
- Break this sub-action into very specific tasks
- Each micro-task should take 15-45 minutes
- Be extremely specific about what needs to be done
- Include exact tools, websites, or resources to use
` : `
- Create ultra-specific micro-steps
- Each step should take 5-20 minutes
- Include exact URLs, specific search terms, or precise instructions
- Make it so specific that anyone could follow the steps
`}

EXAMPLES for "${action.title}":
${action.title.toLowerCase().includes('market research') ? `
- "Search Google for 'top 10 EdTech platforms 2024' and create a spreadsheet"
- "Visit Crunchbase.com and research 5 EdTech startups funding rounds"
- "Join r/EdTech subreddit and read top 20 posts from this month"
- "Create comparison table with pricing, features, target audience"
` : action.title.toLowerCase().includes('design') ? `
- "Open Figma and create new project called '[Project Name] Design'"
- "Research 5 competitor websites and screenshot key pages"
- "Create wireframe for homepage with specific sections listed"
- "Design color palette using Coolors.co and save hex codes"
` : action.title.toLowerCase().includes('development') ? `
- "Set up GitHub repository with README and folder structure"
- "Install required dependencies: npm install [specific packages]"
- "Create basic component structure in src/components folder"
- "Write unit tests for core functionality using Jest"
` : `
- "Open Google Docs and create project outline with 5 main sections"
- "Set 25-minute Pomodoro timer and research [specific topic]"
- "Create checklist with 10 specific deliverables"
- "Schedule 30-minute review meeting with [stakeholder]"
`}

Respond with a JSON object in this exact format:
{
  "subActions": [
    {
      "title": "Very specific action with tools/resources mentioned",
      "description": "Detailed explanation including exact steps",
      "estimatedMinutes": 25,
      "category": "research|planning|execution|review|communication",
      "tools": ["Specific tool or website name"],
      "deliverable": "Exactly what you'll have when done"
    }
  ],
  "reasoning": "Why this breakdown approach makes sense"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a productivity expert who breaks down complex tasks into manageable steps. Always respond with valid JSON."
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

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      return NextResponse.json({
        error: 'Invalid response format from AI',
        fallback: generateFallbackBreakdown(action, level)
      }, { status: 200 });
    }

    // Add unique IDs to each sub-action
    const subActions = parsedResponse.subActions.map((subAction: any, index: number) => ({
      ...subAction,
      id: `${action.id}-sub-${Date.now()}-${index}`,
      parentId: action.id,
      level: level + 1,
      completed: false,
      subActions: [] // Initialize empty sub-actions array
    }));

    // Save sub-actions to database if goalId or milestoneId is provided
    if (goalId || milestoneId) {
      await saveSubActionsToDatabase(subActions, goalId, milestoneId, action.id);
    }

    return NextResponse.json({
      subActions,
      reasoning: parsedResponse.reasoning
    });

  } catch (error) {
    console.error('Action breakdown error:', error);

    // Return fallback breakdown on error
    const body = await request.json().catch(() => ({ action: null, level: 0 }));
    return NextResponse.json({
      error: 'Failed to process with AI',
      fallback: generateFallbackBreakdown(body.action, body.level || 0)
    }, { status: 200 });
  }
}

function generateFallbackBreakdown(action: any, level: number) {
  const baseSteps = [
    {
      title: `Research requirements for "${action?.title || 'this task'}"`,
      description: "Gather information and understand what needs to be done",
      estimatedMinutes: 20,
      category: "research",
      dependencies: []
    },
    {
      title: `Plan approach for "${action?.title || 'this task'}"`,
      description: "Create a detailed plan and gather necessary resources",
      estimatedMinutes: 15,
      category: "planning",
      dependencies: []
    },
    {
      title: `Execute the main work for "${action?.title || 'this task'}"`,
      description: "Perform the core activities required",
      estimatedMinutes: 45,
      category: "execution",
      dependencies: []
    },
    {
      title: `Review and finalize "${action?.title || 'this task'}"`,
      description: "Check quality and make any necessary adjustments",
      estimatedMinutes: 10,
      category: "review",
      dependencies: []
    }
  ];

  return {
    subActions: baseSteps.map((step, index) => ({
      ...step,
      id: `${action?.id || 'fallback'}-sub-${Date.now()}-${index}`,
      parentId: action?.id,
      level: level + 1,
      completed: false,
      subActions: []
    })),
    reasoning: "Generated fallback breakdown due to API unavailability"
  };
}

async function saveSubActionsToDatabase(subActions: any[], goalId?: string, milestoneId?: string, parentActionId?: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Get user from request
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('No user found for saving sub-actions');
      return;
    }

    if (goalId) {
      // Save as regular actions with parent_id
      const actionsToInsert = subActions.map((subAction: any) => ({
        goal_id: goalId,
        parent_id: parentActionId,
        title: subAction.title,
        completed: subAction.completed || false,
        date: subAction.date || new Date().toISOString().split('T')[0],
        impact: subAction.impact || subAction.estimatedMinutes || 10,
        level: subAction.level || 1,
        is_expanded: false
      }));

      const { error: actionsError } = await supabase
        .from('actions')
        .insert(actionsToInsert);

      if (actionsError) {
        console.error('Error saving sub-actions:', actionsError);
      } else {
        console.log('Successfully saved sub-actions to database');
      }
    } else if (milestoneId) {
      // Save as milestone actions
      const milestoneActionsToInsert = subActions.map((subAction: any) => ({
        milestone_id: milestoneId,
        parent_id: parentActionId,
        title: subAction.title,
        completed: subAction.completed || false,
        date: subAction.date || new Date().toISOString().split('T')[0],
        impact: subAction.impact || subAction.estimatedMinutes || 10,
        level: subAction.level || 1,
        is_expanded: false
      }));

      const { error: milestoneActionsError } = await supabase
        .from('milestone_actions')
        .insert(milestoneActionsToInsert);

      if (milestoneActionsError) {
        console.error('Error saving milestone sub-actions:', milestoneActionsError);
      } else {
        console.log('Successfully saved milestone sub-actions to database');
      }
    }
  } catch (error) {
    console.error('Error in saveSubActionsToDatabase:', error);
  }
}