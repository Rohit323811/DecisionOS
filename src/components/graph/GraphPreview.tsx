import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

type NodeTone = 'decision' | 'variable' | 'dependency' | 'positive' | 'warning' | 'negative';

interface PreviewNode {
  id: string;
  label: string;
  value?: string;
  x: number;
  y: number;
  tone: NodeTone;
}

interface PreviewEdge {
  from: string;
  to: string;
  dashed?: boolean;
}

const COL = { decision: 30, variable: 258, dependency: 486, consequence: 714 };
const NODE_W = 166;
const NODE_H = 38;

const NODES: PreviewNode[] = [
{ id: 'd', label: 'Become a contractor', x: COL.decision, y: 196, tone: 'decision' },

{ id: 'v1', label: 'Weekly hours', value: '38 h', x: COL.variable, y: 62, tone: 'variable' },
{ id: 'v2', label: 'Course load', value: '15 cr', x: COL.variable, y: 152, tone: 'variable' },
{ id: 'v3', label: 'Active clients', value: '3', x: COL.variable, y: 242, tone: 'variable' },
{ id: 'v4', label: 'Recovery time', value: '6 h', x: COL.variable, y: 332, tone: 'variable' },

{ id: 'p1', label: 'Delivery quality', x: COL.dependency, y: 88, tone: 'dependency' },
{ id: 'p2', label: 'Effective rate', x: COL.dependency, y: 196, tone: 'dependency' },
{ id: 'p3', label: 'Academic standing', x: COL.dependency, y: 304, tone: 'dependency' },

{ id: 'c1', label: 'Income stabilises', x: COL.consequence, y: 62, tone: 'positive' },
{ id: 'c2', label: 'Grade risk rises', x: COL.consequence, y: 170, tone: 'negative' },
{ id: 'c3', label: 'Recovery → 0', x: COL.consequence, y: 278, tone: 'warning' },
{ id: 'c4', label: 'Aid threshold hit', x: COL.consequence, y: 386, tone: 'negative' }];


const EDGES: PreviewEdge[] = [
{ from: 'd', to: 'v1' },
{ from: 'd', to: 'v2' },
{ from: 'd', to: 'v3' },
{ from: 'd', to: 'v4', dashed: true },
{ from: 'v1', to: 'p1' },
{ from: 'v3', to: 'p1' },
{ from: 'v1', to: 'p2' },
{ from: 'v2', to: 'p3' },
{ from: 'v4', to: 'p3', dashed: true },
{ from: 'p1', to: 'c1' },
{ from: 'p2', to: 'c1' },
{ from: 'p3', to: 'c2' },
{ from: 'v4', to: 'c3' },
{ from: 'p3', to: 'c4', dashed: true }];


const TONE_STROKE: Record<NodeTone, string> = {
  decision: '#3fbfb0',
  variable: '#39404a',
  dependency: '#343a43',
  positive: '#2b4331',
  warning: '#4a3b23',
  negative: '#4a2e2b'
};

const TONE_FILL: Record<NodeTone, string> = {
  decision: '#101f1d',
  variable: '#14171b',
  dependency: '#111317',
  positive: '#111c14',
  warning: '#1a1610',
  negative: '#1b1312'
};

const TONE_TEXT: Record<NodeTone, string> = {
  decision: '#7fded1',
  variable: '#c8ccd2',
  dependency: '#99a0a9',
  positive: '#7bc47f',
  warning: '#e0a458',
  negative: '#e0685e'
};

const byId = (id: string) => NODES.find((n) => n.id === id)!;

function edgePath(from: PreviewNode, to: PreviewNode) {
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const dx = Math.max(38, (x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function connected(nodeId: string) {
  const set = new Set<string>([nodeId]);
  EDGES.forEach((e) => {
    if (e.from === nodeId) set.add(e.to);
    if (e.to === nodeId) set.add(e.from);
  });
  return set;
}

const COLUMNS = [
{ label: 'Decision', x: COL.decision },
{ label: 'Variables', x: COL.variable },
{ label: 'Dependencies', x: COL.dependency },
{ label: 'Consequences', x: COL.consequence }];


export function GraphPreview({ className }: {className?: string;}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ? connected(hovered) : null;

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        viewBox="0 0 910 452"
        className="w-full"
        role="img"
        aria-label="Decision graph preview: a decision connected to variables, dependencies and consequences">
        
        {COLUMNS.map((c) =>
        <text
          key={c.label}
          x={c.x}
          y={18}
          className="font-mono"
          fontSize={9.5}
          letterSpacing="1.4"
          fill="#636a73">
          
            {c.label.toUpperCase()}
          </text>
        )}

        <g>
          {EDGES.map((e, i) => {
            const from = byId(e.from);
            const to = byId(e.to);
            const isActive = !active || active.has(e.from) && active.has(e.to);
            return (
              <motion.path
                key={`${e.from}-${e.to}`}
                d={edgePath(from, to)}
                fill="none"
                stroke={active && isActive ? '#3fbfb0' : '#262b32'}
                strokeWidth={active && isActive ? 1.4 : 1}
                strokeDasharray={e.dashed ? '3 4' : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: active ? isActive ? 1 : 0.25 : 1
                }}
                transition={{
                  pathLength: { duration: 0.7, delay: 0.25 + i * 0.045, ease: [0.23, 1, 0.32, 1] },
                  opacity: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
                  stroke: { duration: 0.18 }
                }} />);


          })}
        </g>

        <g>
          {NODES.map((n, i) => {
            const isActive = !active || active.has(n.id);
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: isActive ? 1 : 0.35, y: 0 }}
                transition={{
                  opacity: { duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: hovered ? 0 : i * 0.04 },
                  y: { duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }
                }}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}>
                
                <rect
                  x={n.x}
                  y={n.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill={TONE_FILL[n.tone]}
                  stroke={hovered === n.id ? '#3fbfb0' : TONE_STROKE[n.tone]}
                  strokeWidth={1}
                  strokeDasharray={n.tone === 'dependency' ? '4 3' : undefined} />
                
                <text
                  x={n.x + 12}
                  y={n.y + 23}
                  fontSize={11.5}
                  fill={TONE_TEXT[n.tone]}
                  fontFamily="Inter, sans-serif">
                  
                  {n.label}
                </text>
                {n.value &&
                <text
                  x={n.x + NODE_W - 12}
                  y={n.y + 23}
                  fontSize={10}
                  textAnchor="end"
                  fill="#636a73"
                  fontFamily="JetBrains Mono, monospace">
                  
                    {n.value}
                  </text>
                }
              </motion.g>);

          })}
        </g>
      </svg>
    </div>);

}