'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Zap,
  Users,
  TrendingUp,
  Brain,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Network,
  MessageSquare,
  Calendar
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Goal Enhancement",
      description: "Transform basic goals into actionable plans with AI-generated milestones, tasks, and smart recommendations.",
      color: "text-blue-500"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Recursive Task Breakdown",
      description: "Break down complex tasks into micro-actions with unlimited depth. Each step becomes manageable and achievable.",
      color: "text-yellow-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Smart Collaboration",
      description: "Find people working on similar goals, get expert recommendations, and build accountability partnerships.",
      color: "text-green-500"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Intelligent Analytics",
      description: "Get insights on task complexity, time estimates, and strategic fit with your broader objectives.",
      color: "text-purple-500"
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Visual Goal Mapping",
      description: "See your goals as interconnected networks and mind maps to understand relationships and priorities.",
      color: "text-orange-500"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "AI Task Analysis",
      description: "Click any task to get comprehensive analysis including difficulty assessment and resource recommendations.",
      color: "text-pink-500"
    }
  ];

  const stats = [
    { label: "Goals Achieved", value: "10,000+", icon: <Target className="w-4 h-4" /> },
    { label: "AI Insights Generated", value: "250K+", icon: <Brain className="w-4 h-4" /> },
    { label: "Collaborations Formed", value: "5,000+", icon: <Users className="w-4 h-4" /> },
    { label: "Success Rate", value: "94%", icon: <TrendingUp className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-lg bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Goal Tracker AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Sign In</Link>
              </Button>
              <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300" asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Advanced AI
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Transform{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Ambitions
            </span>
            <br />
            Into{" "}
            <span className="bg-gradient-success bg-clip-text text-transparent">
              Achievements
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            The world's most intelligent goal tracking platform. Use AI to break down complex goals,
            find collaborators, and get personalized insights that accelerate your success.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6" asChild>
              <Link href="/dashboard">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2 text-primary">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Supercharged with{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every feature is designed to make goal achievement effortless and collaborative
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`bg-gradient-card border-border shadow-elegant hover:shadow-glow transition-all duration-300 cursor-pointer ${
                  hoveredFeature === index ? 'scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardHeader>
                  <div className={`${feature.color} mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Four simple steps to transform your goals into systematic success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Set Your Goal",
                description: "Enter your goal and our AI will instantly enhance it with actionable steps",
                icon: <Target className="w-8 h-8" />
              },
              {
                step: "2",
                title: "AI Breakdown",
                description: "Click any task to break it down into micro-actions with unlimited depth",
                icon: <Zap className="w-8 h-8" />
              },
              {
                step: "3",
                title: "Get Insights",
                description: "Analyze task complexity, find collaborators, and get resource recommendations",
                icon: <Brain className="w-8 h-8" />
              },
              {
                step: "4",
                title: "Track Progress",
                description: "Monitor your advancement with intelligent analytics and achieve your goals",
                icon: <CheckCircle className="w-8 h-8" />
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl font-bold mb-6 mx-auto">
                  {step.step}
                </div>
                <div className="text-primary mb-4 flex justify-center">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Achieve{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              More?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of achievers who are using AI to turn their biggest dreams into systematic success stories.
          </p>
          <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-12 py-6" asChild>
            <Link href="/dashboard">
              Start Your Free Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Start achieving in under 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/40">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Goal Tracker AI</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-muted-foreground">
            © 2024 Goal Tracker AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}