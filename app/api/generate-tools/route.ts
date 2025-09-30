import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { goals } = await request.json()

    if (!goals || goals.length === 0) {
      return NextResponse.json({ error: 'No goals provided' }, { status: 400 })
    }

    // Extract goal contexts for AI personalization
    const goalContexts = goals.map((goal: any) => ({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      progress: goal.progress
    }))

    const prompt = `Based on these user goals: ${JSON.stringify(goalContexts)}, generate personalized productivity tools.

Create content that includes:

1. An inspirational quote with author and specific context for why it relates to their goals
2. A dopamine boost technique (scientifically-backed, 5-15 minutes)
3. A focus session with specific steps tailored to their goal type
4. 2-3 relevant resources (books, podcasts, articles) with summaries and key takeaways
5. 2-3 habit recommendations with scientific backing

Make it highly specific to their goal types. For example:
- If they're writing a novel: Include Cal Newport's Deep Work concepts, writing-specific dopamine techniques, author-focused resources
- If building a business: Include startup-focused content, entrepreneurial habits, business strategy resources
- If learning new skills: Include learning science, spaced repetition, skill acquisition techniques

Base the content on real experts like Cal Newport, Andrew Huberman, James Clear, Tim Ferriss, etc.

Return as valid JSON with this structure:
{
  "tools": {
    "inspiration": {
      "quote": "...",
      "author": "...",
      "context": "..."
    },
    "dopamineBoost": {
      "title": "...",
      "technique": "...",
      "duration": "...",
      "description": "..."
    },
    "focusSession": {
      "title": "...",
      "method": "...",
      "duration": 25,
      "steps": ["...", "...", "..."]
    },
    "resources": [
      {
        "title": "...",
        "type": "book|podcast|article|course",
        "summary": "...",
        "keyTakeaways": ["...", "...", "..."],
        "relevance": "..."
      }
    ],
    "habits": [
      {
        "title": "...",
        "frequency": "...",
        "description": "...",
        "scientificBasis": "..."
      }
    ]
  }
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a productivity and goal achievement expert. Generate personalized, science-backed tools and resources to help users achieve their specific goals. Always return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    })

    const responseText = completion.choices[0]?.message?.content?.trim()

    if (!responseText) {
      throw new Error('Empty response from OpenAI')
    }

    let parsedResponse
    try {
      // Try to parse the response as JSON
      parsedResponse = JSON.parse(responseText)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from markdown
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Invalid JSON response from AI')
      }
    }

    return NextResponse.json(parsedResponse)

  } catch (error) {
    console.error('Error generating tools:', error)

    // Fallback response
    const fallbackTools = {
      tools: {
        inspiration: {
          quote: "The way to get started is to quit talking and begin doing.",
          author: "Walt Disney",
          context: "Taking action is the first step toward achieving any goal. Your goals require consistent effort and execution."
        },
        dopamineBoost: {
          title: "Victory Visualization",
          technique: "Mental rehearsal",
          duration: "5 minutes",
          description: "Close your eyes and vividly imagine completing your goal. Feel the emotions, see the details, and experience the satisfaction. This activates the same neural pathways as actual achievement."
        },
        focusSession: {
          title: "Deep Work Block",
          method: "Pomodoro + Single-tasking",
          duration: 25,
          steps: [
            "Choose one specific task related to your goal",
            "Eliminate all distractions (phone, notifications, etc.)",
            "Set timer for 25 minutes and work with complete focus",
            "Take a 5-minute break to recharge",
            "Repeat for 2-4 cycles for maximum productivity"
          ]
        },
        resources: [
          {
            title: "Deep Work by Cal Newport",
            type: "book",
            summary: "A guide to focused success in a distracted world, showing how to cultivate the ability to focus on cognitively demanding tasks.",
            keyTakeaways: [
              "Deep work is becoming increasingly rare and valuable",
              "Structured approaches to concentration improve output quality",
              "Elimination of shallow work maximizes meaningful progress"
            ],
            relevance: "Essential for making consistent progress on complex goals requiring sustained attention."
          }
        ],
        habits: [
          {
            title: "Morning Goal Review",
            frequency: "Daily",
            description: "Spend 5 minutes each morning reviewing your goals and planning the day's most important task.",
            scientificBasis: "Research shows that implementation intentions (if-then planning) increase goal achievement by 2-3x."
          }
        ]
      }
    }

    return NextResponse.json(fallbackTools)
  }
}