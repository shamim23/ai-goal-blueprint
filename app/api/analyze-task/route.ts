import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { task, context, userGoals } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        fallback: generateFallbackAnalysis(task, context)
      }, { status: 200 });
    }

    // Use OpenAI to analyze the task
    const analysis = await analyzeTaskWithOpenAI(task, context, userGoals);
    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Task analysis error:', error);

    // Return fallback analysis
    const body = await request.json().catch(() => ({ task: null, context: null }));
    return NextResponse.json({
      error: 'Failed to analyze with AI',
      fallback: generateFallbackAnalysis(body.task, body.context)
    }, { status: 200 });
  }
}

async function analyzeTaskWithOpenAI(task: any, context: any, userGoals: any[]) {
  const prompt = `
You are an expert productivity analyst and collaboration specialist. Analyze this task and provide comprehensive insights.

TASK DETAILS:
- Title: "${task.title}"
- Type: ${task.type || 'action'}
- Context: ${context ? `Part of goal "${context.goalTitle}" (${context.goalCategory})` : 'Standalone task'}
- Impact Score: ${task.impact || 'N/A'}
- Due Date: ${task.date || 'N/A'}

USER'S OTHER GOALS:
${userGoals.map(goal => `- ${goal.title} (${goal.category})`).join('\n')}

ANALYSIS REQUIRED:
1. **Task Complexity & Insights**
   - Difficulty level (1-10) and why
   - Key skills/knowledge required
   - Potential challenges and blockers
   - Success factors and best practices

2. **Strategic Analysis**
   - How this task fits into broader goals
   - Dependencies with other tasks/goals
   - Priority level and urgency assessment
   - ROI and impact analysis

3. **Collaboration Opportunities**
   - What skills/expertise would be helpful
   - Types of collaborators who could assist
   - Knowledge areas that overlap
   - Potential mentors or advisors

4. **Resource Recommendations**
   - Specific tools and platforms
   - Learning resources and tutorials
   - Communities and forums
   - Industry experts to follow

5. **Similar Tasks & Topics**
   - Related task categories
   - Keywords and tags for finding similar work
   - Industry domains and specializations
   - Common project types this relates to

Respond with a JSON object in this exact format:
{
  "complexity": {
    "level": 7,
    "reasoning": "Requires advanced technical skills and domain knowledge...",
    "skills": ["Market Research", "Data Analysis", "EdTech Knowledge"],
    "challenges": ["Finding reliable data sources", "Time constraints"],
    "successFactors": ["Systematic approach", "Multiple data sources"]
  },
  "strategy": {
    "priority": "High",
    "fitWithGoals": "This task directly supports your learning goal...",
    "dependencies": ["Complete user research first", "Need budget approval"],
    "roi": "High - Will save 20+ hours of manual research"
  },
  "collaboration": {
    "helpfulSkills": ["EdTech industry experience", "Market analysis", "Data visualization"],
    "collaboratorTypes": ["Industry veterans", "Data analysts", "EdTech entrepreneurs"],
    "communities": ["r/EdTech", "EdTech professionals on LinkedIn", "Product Hunt"],
    "mentorProfile": "Someone with 5+ years in EdTech market analysis"
  },
  "resources": {
    "tools": ["Crunchbase", "SimilarWeb", "Google Trends", "Ahrefs"],
    "learning": ["Coursera Market Research course", "EdTech industry reports"],
    "communities": ["EdTech Hub Slack", "EdSurge community"],
    "experts": ["@edtechreporter on Twitter", "CB Insights analysts"]
  },
  "similarTopics": {
    "categories": ["Market Research", "Competitive Analysis", "EdTech", "SaaS Analysis"],
    "keywords": ["edtech platforms", "learning management systems", "educational software"],
    "industries": ["Education Technology", "E-learning", "Corporate Training"],
    "projectTypes": ["Competitor research", "Market sizing", "User research"]
  },
  "summary": "This is a high-impact market research task that requires systematic data collection and analysis skills. Success depends on using multiple reliable sources and connecting with EdTech industry professionals.",
  "timeEstimate": "6-8 hours over 2-3 days",
  "difficultyTips": ["Start with broad research then narrow down", "Use both quantitative and qualitative sources", "Connect with industry insiders for insights"]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a productivity and collaboration expert who provides comprehensive task analysis. Always respond with valid JSON that helps users understand their tasks better and find relevant collaborators."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
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

  // Add mock similar users (in a real app, this would query a user database)
  const similarUsers = generateSimilarUsers(parsedResponse.similarTopics, task);

  return {
    ...parsedResponse,
    similarUsers,
    analysisDate: new Date().toISOString()
  };
}

function generateSimilarUsers(similarTopics: any, task: any) {
  // Mock users working on similar topics (in production, this would be real user data)
  const userProfiles = [
    {
      id: 'user1',
      name: 'Sarah Chen',
      avatar: '👩‍💼',
      skills: ['Market Research', 'EdTech', 'Data Analysis'],
      currentProjects: ['EdTech Platform Analysis', 'Learning Analytics Dashboard'],
      experience: '5 years in EdTech',
      availability: 'Available for collaboration',
      matchReason: 'Working on similar EdTech market research'
    },
    {
      id: 'user2',
      name: 'Marcus Rodriguez',
      avatar: '👨‍💻',
      skills: ['Competitive Analysis', 'SaaS Research', 'Product Strategy'],
      currentProjects: ['SaaS Competitive Landscape', 'Product Market Fit Analysis'],
      experience: '3 years in SaaS',
      availability: 'Open to mentoring',
      matchReason: 'Expert in competitive analysis methodologies'
    },
    {
      id: 'user3',
      name: 'Dr. Emily Watson',
      avatar: '👩‍🎓',
      skills: ['Education Research', 'Academic Analysis', 'Industry Reports'],
      currentProjects: ['Online Learning Trends', 'Educational Technology Impact Study'],
      experience: '10 years in education research',
      availability: 'Available weekends',
      matchReason: 'Deep expertise in educational technology research'
    },
    {
      id: 'user4',
      name: 'Alex Kumar',
      avatar: '👨‍🎨',
      skills: ['Data Visualization', 'Market Insights', 'Research Tools'],
      currentProjects: ['Market Research Automation', 'Industry Data Dashboard'],
      experience: '4 years in market research',
      availability: 'Active collaborator',
      matchReason: 'Specialized in research tools and data visualization'
    }
  ];

  // Filter users based on task relevance
  return userProfiles.filter(user => {
    const taskLower = task.title.toLowerCase();
    const userSkillsLower = user.skills.join(' ').toLowerCase();

    return (
      taskLower.includes('market') && userSkillsLower.includes('market') ||
      taskLower.includes('research') && userSkillsLower.includes('research') ||
      taskLower.includes('edtech') && userSkillsLower.includes('edtech') ||
      taskLower.includes('analysis') && userSkillsLower.includes('analysis')
    );
  }).slice(0, 3); // Return top 3 matches
}

function generateFallbackAnalysis(task: any, context: any) {
  return {
    complexity: {
      level: 6,
      reasoning: "This appears to be a moderately complex task requiring research and analysis skills.",
      skills: ["Research", "Analysis", "Communication"],
      challenges: ["Time management", "Information overload"],
      successFactors: ["Systematic approach", "Clear documentation"]
    },
    strategy: {
      priority: "Medium",
      fitWithGoals: "This task supports your overall goal progression.",
      dependencies: ["Gather initial requirements", "Allocate sufficient time"],
      roi: "Moderate - Will provide valuable insights"
    },
    collaboration: {
      helpfulSkills: ["Domain expertise", "Research experience", "Analytical skills"],
      collaboratorTypes: ["Industry experts", "Researchers", "Colleagues"],
      communities: ["Professional networks", "Industry forums", "LinkedIn groups"],
      mentorProfile: "Someone with relevant industry experience"
    },
    resources: {
      tools: ["Google", "LinkedIn", "Industry reports", "Research databases"],
      learning: ["Online courses", "Industry blogs", "Professional articles"],
      communities: ["Professional associations", "Industry forums"],
      experts: ["Industry thought leaders", "Professional contacts"]
    },
    similarTopics: {
      categories: ["Research", "Analysis", "Planning"],
      keywords: ["research", "analysis", "strategy"],
      industries: ["Technology", "Business", "Consulting"],
      projectTypes: ["Research projects", "Analysis tasks", "Strategic planning"]
    },
    similarUsers: [],
    summary: "This task requires careful planning and execution. Consider breaking it down into smaller, manageable steps.",
    timeEstimate: "4-6 hours",
    difficultyTips: ["Start with an outline", "Gather resources first", "Set realistic timelines"],
    analysisDate: new Date().toISOString()
  };
}