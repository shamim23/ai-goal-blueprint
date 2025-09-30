'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  Zap,
  Target,
  BookOpen,
  Headphones,
  Timer,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { Goal } from '@/app/dashboard/page'

interface ToolsProps {
  goals: Goal[]
}

interface ToolContent {
  inspiration: {
    quote: string
    author: string
    context: string
  }
  dopamineBoost: {
    title: string
    technique: string
    duration: string
    description: string
  }
  focusSession: {
    title: string
    method: string
    duration: number
    steps: string[]
  }
  resources: {
    title: string
    type: 'book' | 'podcast' | 'article' | 'course'
    summary: string
    keyTakeaways: string[]
    relevance: string
  }[]
  habits: {
    title: string
    frequency: string
    description: string
    scientificBasis: string
  }[]
}

export function ToolsSection({ goals }: ToolsProps) {
  const [toolContent, setToolContent] = useState<ToolContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [focusTimer, setFocusTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(25)

  const fetchSavedTools = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tools')
      if (response.ok) {
        const data = await response.json()
        if (data.hasTools) {
          setToolContent(data.tools)
          setIsLoading(false)
          return true
        }
      }
    } catch (error) {
      console.error('Error fetching saved tools:', error)
    }
    setIsLoading(false)
    return false
  }

  const generateTools = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals }),
      })

      if (response.ok) {
        const data = await response.json()
        setToolContent(data.tools)

        // Save the generated tools to database
        await saveTools(data.tools)
      }
    } catch (error) {
      console.error('Error generating tools:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTools = async (tools: ToolContent) => {
    try {
      await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tools, goals }),
      })
    } catch (error) {
      console.error('Error saving tools:', error)
    }
  }

  useEffect(() => {
    if (goals.length > 0 && !hasInitialized) {
      setHasInitialized(true)
      fetchSavedTools().then(hasSaved => {
        if (!hasSaved) {
          generateTools()
        }
      })
    }
  }, [goals, hasInitialized])

  // Focus Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && focusTimer > 0) {
      interval = setInterval(() => {
        setFocusTimer(timer => timer - 1)
      }, 1000)
    } else if (focusTimer === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      // Could add notification here
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, focusTimer])

  const startTimer = (duration: number) => {
    setFocusTimer(duration * 60)
    setSelectedDuration(duration)
    setIsTimerRunning(true)
  }

  const pauseTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setFocusTimer(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!toolContent && !isLoading) {
    return (
      <Card className="bg-gradient-card border-border shadow-elegant">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
          <p className="text-muted-foreground text-center mb-6">
            Create goals to unlock personalized productivity tools
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Productivity Tools
          </h2>
          <p className="text-muted-foreground">
            AI-powered tools tailored to your goals
          </p>
        </div>
        <Button
          onClick={generateTools}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Generating...' : 'Generate New Tools'}
        </Button>
      </div>

      {isLoading ? (
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Generating personalized tools...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="inspiration" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inspiration" className="flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Inspire
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Focus
            </TabsTrigger>
            <TabsTrigger value="dopamine" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Boost
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Habits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspiration" className="space-y-4">
            {toolContent?.inspiration && (
              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Daily Inspiration
                  </CardTitle>
                  <CardDescription>Tailored motivation for your journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <blockquote className="border-l-4 border-primary pl-4 italic text-lg">
                    "{toolContent.inspiration.quote}"
                  </blockquote>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">— {toolContent.inspiration.author}</span>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Why this matters for you:</strong> {toolContent.inspiration.context}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="focus" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Focus Timer */}
              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    Focus Timer
                  </CardTitle>
                  <CardDescription>Pomodoro technique for deep work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-4">
                      {formatTime(focusTimer)}
                    </div>
                    <div className="flex gap-2 justify-center mb-4">
                      <Button
                        size="sm"
                        variant={selectedDuration === 25 ? "default" : "outline"}
                        onClick={() => startTimer(25)}
                      >
                        25m
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedDuration === 15 ? "default" : "outline"}
                        onClick={() => startTimer(15)}
                      >
                        15m
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedDuration === 5 ? "default" : "outline"}
                        onClick={() => startTimer(5)}
                      >
                        5m
                      </Button>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={pauseTimer}>
                        {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetTimer}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Focus Technique */}
              {toolContent?.focusSession && (
                <Card className="bg-gradient-card border-border shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      {toolContent.focusSession.title}
                    </CardTitle>
                    <CardDescription>
                      {toolContent.focusSession.method} • {toolContent.focusSession.duration}min
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {toolContent.focusSession.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dopamine" className="space-y-4">
            {toolContent?.dopamineBoost && (
              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    {toolContent.dopamineBoost.title}
                  </CardTitle>
                  <CardDescription>
                    {toolContent.dopamineBoost.technique} • {toolContent.dopamineBoost.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-sm">{toolContent.dopamineBoost.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toolContent?.resources?.map((resource, index) => (
                <Card key={index} className="bg-gradient-card border-border shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {resource.type === 'book' && <BookOpen className="w-5 h-5 text-primary" />}
                      {resource.type === 'podcast' && <Headphones className="w-5 h-5 text-primary" />}
                      {resource.type === 'article' && <BookOpen className="w-5 h-5 text-primary" />}
                      {resource.type === 'course' && <Target className="w-5 h-5 text-primary" />}
                      {resource.title}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="mb-2">
                        {resource.type}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{resource.summary}</p>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Takeaways:</h4>
                      <ul className="space-y-1">
                        {resource.keyTakeaways.map((takeaway, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-primary">•</span>
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-muted/10 rounded text-xs text-muted-foreground">
                      <strong>Why this helps:</strong> {resource.relevance}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="habits" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toolContent?.habits?.map((habit, index) => (
                <Card key={index} className="bg-gradient-card border-border shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      {habit.title}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline">{habit.frequency}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{habit.description}</p>
                    <div className="p-3 bg-muted/10 rounded text-xs text-muted-foreground">
                      <strong>Science:</strong> {habit.scientificBasis}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}