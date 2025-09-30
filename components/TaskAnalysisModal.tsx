'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Target,
  Users,
  Lightbulb,
  TrendingUp,
  ExternalLink,
  Brain,
  Zap,
  Star,
  Calendar,
  MessageCircle,
  Loader2
} from "lucide-react";

interface TaskAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  taskType: 'action' | 'milestone';
  onAnalyze: () => Promise<any>;
}

interface AnalysisData {
  complexity: {
    level: number;
    reasoning: string;
    skills: string[];
    challenges: string[];
    successFactors: string[];
  };
  strategy: {
    priority: string;
    fitWithGoals: string;
    dependencies: string[];
    roi: string;
  };
  collaboration: {
    helpfulSkills: string[];
    collaboratorTypes: string[];
    communities: string[];
    mentorProfile: string;
  };
  resources: {
    tools: string[];
    learning: string[];
    communities: string[];
    experts: string[];
  };
  similarTopics: {
    categories: string[];
    keywords: string[];
    industries: string[];
    projectTypes: string[];
  };
  similarUsers: Array<{
    id: string;
    name: string;
    avatar: string;
    skills: string[];
    currentProjects: string[];
    experience: string;
    availability: string;
    matchReason: string;
  }>;
  summary: string;
  timeEstimate: string;
  difficultyTips: string[];
}

export function TaskAnalysisModal({
  open,
  onOpenChange,
  taskTitle,
  taskType,
  onAnalyze
}: TaskAnalysisModalProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await onAnalyze();
      setAnalysisData(data);
    } catch (err) {
      setError('Failed to analyze task. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-yellow-500';
    if (level <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Analysis: {taskTitle}
          </DialogTitle>
          <DialogDescription>
            Comprehensive insights and collaboration opportunities for this {taskType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!analysisData && !isLoading && (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground mb-4">
                Get AI-powered insights about this task including complexity analysis,
                collaboration opportunities, and resource recommendations.
              </p>
              <Button onClick={handleAnalyze} className="bg-gradient-primary">
                <Zap className="w-4 h-4 mr-2" />
                Analyze Task
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analyzing Task...</h3>
              <p className="text-muted-foreground">
                AI is examining your task for insights and collaboration opportunities
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <Button
                  onClick={handleAnalyze}
                  variant="outline"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {analysisData && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Complexity Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Difficulty Level</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getDifficultyColor(analysisData.complexity.level)}`} />
                          <span className="font-bold">{analysisData.complexity.level}/10</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{analysisData.complexity.reasoning}</p>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Required Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysisData.complexity.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time & Priority
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estimated Time</span>
                        <Badge variant="outline">{analysisData.timeEstimate}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Priority Level</span>
                        <Badge className={getPriorityColor(analysisData.strategy.priority)}>
                          {analysisData.strategy.priority}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Expected ROI:</span>
                        <p className="text-sm mt-1">{analysisData.strategy.roi}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{analysisData.summary}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-orange-700">Potential Challenges</h4>
                        <ul className="space-y-1">
                          {analysisData.complexity.challenges.map((challenge, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-orange-500 mt-0.5">•</span>
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-green-700">Success Factors</h4>
                        <ul className="space-y-1">
                          {analysisData.complexity.successFactors.map((factor, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Pro Tips</h4>
                      <ul className="space-y-1">
                        {analysisData.difficultyTips.map((tip, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                            <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="collaboration" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Similar Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysisData.similarUsers.length > 0 ? (
                        analysisData.similarUsers.map((user) => (
                          <div key={user.id} className="p-3 border rounded-lg">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback>{user.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm">{user.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {user.availability}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {user.experience}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  {user.matchReason}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {user.skills.slice(0, 3).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                                <Button size="sm" variant="outline" className="mt-2">
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Connect
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No similar users found for this task.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Collaboration Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Helpful Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisData.collaboration.helpfulSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-sm mb-2">Ideal Collaborators</h4>
                        <ul className="space-y-1">
                          {analysisData.collaboration.collaboratorTypes.map((type, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-primary mt-0.5">•</span>
                              {type}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-sm mb-2">Mentor Profile</h4>
                        <p className="text-xs text-muted-foreground">
                          {analysisData.collaboration.mentorProfile}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-sm mb-2">Communities</h4>
                        <div className="space-y-1">
                          {analysisData.collaboration.communities.map((community, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-xs">{community}</span>
                              <Button size="sm" variant="ghost" className="h-6 px-2">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Tools & Platforms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisData.resources.tools.map((tool, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{tool}</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Learning Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisData.resources.learning.map((resource, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{resource}</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Expert Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisData.resources.experts.map((expert, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{expert}</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Related Topics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Categories</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisData.similarTopics.categories.map((category, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisData.similarTopics.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="strategy" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Strategic Fit
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{analysisData.strategy.fitWithGoals}</p>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Dependencies</h4>
                        <ul className="space-y-1">
                          {analysisData.strategy.dependencies.map((dependency, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-primary mt-0.5">•</span>
                              {dependency}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Project Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Related Industries</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisData.similarTopics.industries.map((industry, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Project Types</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisData.similarTopics.projectTypes.map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}