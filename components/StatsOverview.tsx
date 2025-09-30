import { TrendingUp, Target, Zap, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsOverviewProps {
  totalGoals: number;
  averageProgress: number;
  totalActions: number;
  completedActions: number;
}

export function StatsOverview({ totalGoals, averageProgress, totalActions, completedActions }: StatsOverviewProps) {
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const stats = [
    {
      title: "Active Goals",
      value: totalGoals,
      icon: Target,
      description: "Goals in progress",
      gradient: "bg-gradient-primary",
      glow: "shadow-glow"
    },
    {
      title: "Avg Progress", 
      value: `${averageProgress}%`,
      icon: TrendingUp,
      description: "Across all goals",
      gradient: "bg-gradient-success",
      glow: "shadow-success"
    },
    {
      title: "Actions Taken",
      value: completedActions,
      icon: Zap,
      description: `${completionRate}% completion rate`,
      gradient: "bg-accent",
      glow: "shadow-success"
    },
    {
      title: "This Week",
      value: "12",
      icon: Calendar,
      description: "Actions completed",
      gradient: "bg-warning",
      glow: "shadow-elegant"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={`bg-gradient-card border-border shadow-elegant hover:${stat.glow} transition-all duration-300`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.gradient}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}