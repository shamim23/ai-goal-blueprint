import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Goal } from '@/pages/Index';

interface NetworkGraphViewProps {
  goals: Goal[];
}

export const NetworkGraphView = ({ goals }: NetworkGraphViewProps) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business': return '💼';
      case 'personal': return '🌟';
      case 'health': return '💪';
      case 'learning': return '📚';
      default: return '🎯';
    }
  };

  // Create goal nodes in a hierarchical layout
  const goalNodes: Node[] = goals.map((goal, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = 200 + col * 400;
    const y = 100 + row * 300;

    return {
      id: goal.id,
      type: 'default',
      data: { 
        label: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{getCategoryIcon(goal.category)}</span>
              <div>
                <div className="font-bold text-sm">{goal.title}</div>
                <div className="text-xs opacity-60">{goal.category}</div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-center">{goal.progress}%</div>
          </div>
        )
      },
      position: { x, y },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        border: '3px solid hsl(var(--primary))',
        borderRadius: '16px',
        padding: '16px',
        width: 200,
        boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)',
      },
    };
  });

  // Create action nodes below each goal
  const actionNodes: Node[] = goals.flatMap((goal, goalIndex) => {
    const goalNode = goalNodes[goalIndex];
    
    return goal.actions.map((action, actionIndex) => {
      const totalActions = goal.actions.length;
      const spacing = Math.min(150, 400 / totalActions);
      const startX = goalNode.position.x - (spacing * (totalActions - 1)) / 2;
      const x = startX + actionIndex * spacing;
      const y = goalNode.position.y + 180;

      return {
        id: `${goal.id}-action-${actionIndex}`,
        type: 'default',
        data: { 
          label: (
            <div className="text-center space-y-1">
              <div className="text-lg">
                {action.completed ? '✅' : '📋'}
              </div>
              <div className="text-xs font-medium leading-tight">
                {action.title}
              </div>
              {action.impact && (
                <div className="text-xs opacity-60">
                  +{action.impact}
                </div>
              )}
            </div>
          )
        },
        position: { x, y },
        targetPosition: Position.Top,
        style: {
          background: action.completed 
            ? 'hsl(var(--primary) / 0.2)' 
            : 'hsl(var(--secondary))',
          color: 'hsl(var(--foreground))',
          border: `2px solid ${action.completed ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
          borderRadius: '12px',
          padding: '10px',
          width: 110,
        },
      };
    });
  });

  const allNodes = [...goalNodes, ...actionNodes];

  // Create edges connecting goals to actions
  const actionEdges: Edge[] = goals.flatMap((goal, goalIndex) => {
    return goal.actions.map((action, actionIndex) => ({
      id: `${goal.id}-action-${actionIndex}-edge`,
      source: goal.id,
      target: `${goal.id}-action-${actionIndex}`,
      animated: !action.completed,
      style: { 
        stroke: action.completed ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        strokeWidth: action.completed ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: action.completed ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
      },
    }));
  });

  // Create edges showing goal relationships (shared actions, similar categories)
  const relationshipEdges: Edge[] = [];
  for (let i = 0; i < goals.length; i++) {
    for (let j = i + 1; j < goals.length; j++) {
      if (goals[i].category === goals[j].category) {
        relationshipEdges.push({
          id: `relation-${goals[i].id}-${goals[j].id}`,
          source: goals[i].id,
          target: goals[j].id,
          animated: false,
          style: { 
            stroke: 'hsl(var(--muted-foreground) / 0.3)',
            strokeWidth: 1,
            strokeDasharray: '5,5',
          },
        });
      }
    }
  }

  const allEdges = [...actionEdges, ...relationshipEdges];

  const [nodes] = useNodesState(allNodes);
  const [edges] = useEdgesState(allEdges);

  return (
    <div className="h-[600px] w-full rounded-lg border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Controls />
        <Background variant={BackgroundVariant.Lines} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
};
