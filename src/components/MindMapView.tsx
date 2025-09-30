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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Goal } from '@/pages/Index';

interface MindMapViewProps {
  goals: Goal[];
}

export const MindMapView = ({ goals }: MindMapViewProps) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business': return '💼';
      case 'personal': return '🌟';
      case 'health': return '💪';
      case 'learning': return '📚';
      default: return '🎯';
    }
  };

  // Create center node
  const centerNode: Node = {
    id: 'center',
    type: 'input',
    data: { label: '🎯 My Goals' },
    position: { x: 400, y: 300 },
    style: {
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      border: '2px solid hsl(var(--primary))',
      borderRadius: '50%',
      width: 120,
      height: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
    },
  };

  // Create goal nodes in a circle around center
  const goalNodes: Node[] = goals.map((goal, index) => {
    const angle = (index / goals.length) * 2 * Math.PI;
    const radius = 250;
    const x = 400 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);

    return {
      id: goal.id,
      type: 'default',
      data: { 
        label: (
          <div className="text-center">
            <div className="text-2xl mb-1">{getCategoryIcon(goal.category)}</div>
            <div className="font-semibold text-sm">{goal.title}</div>
            <div className="text-xs opacity-70">{goal.progress}%</div>
          </div>
        )
      },
      position: { x, y },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        border: '2px solid hsl(var(--primary))',
        borderRadius: '12px',
        padding: '12px',
        width: 140,
      },
    };
  });

  // Create action nodes branching from each goal
  const actionNodes: Node[] = goals.flatMap((goal, goalIndex) => {
    return goal.actions.slice(0, 3).map((action, actionIndex) => {
      const goalNode = goalNodes[goalIndex];
      const offsetAngle = ((actionIndex - 1) * Math.PI) / 6;
      const baseAngle = (goalIndex / goals.length) * 2 * Math.PI;
      const actionRadius = 120;
      const x = goalNode.position.x + actionRadius * Math.cos(baseAngle + offsetAngle);
      const y = goalNode.position.y + actionRadius * Math.sin(baseAngle + offsetAngle);

      return {
        id: `${goal.id}-action-${actionIndex}`,
        type: 'output',
        data: { 
          label: (
            <div className="text-xs">
              {action.completed ? '✅' : '⭕'} {action.title}
            </div>
          )
        },
        position: { x, y },
        targetPosition: Position.Left,
        style: {
          background: action.completed ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          padding: '8px',
          fontSize: '11px',
          width: 120,
        },
      };
    });
  });

  const allNodes = [centerNode, ...goalNodes, ...actionNodes];

  // Create edges
  const goalEdges: Edge[] = goals.map(goal => ({
    id: `center-${goal.id}`,
    source: 'center',
    target: goal.id,
    animated: true,
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  }));

  const actionEdges: Edge[] = goals.flatMap((goal, goalIndex) => {
    return goal.actions.slice(0, 3).map((action, actionIndex) => ({
      id: `${goal.id}-action-${actionIndex}-edge`,
      source: goal.id,
      target: `${goal.id}-action-${actionIndex}`,
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 },
    }));
  });

  const allEdges = [...goalEdges, ...actionEdges];

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
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};
