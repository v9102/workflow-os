export interface SwarmAgent {
  id: string;
  name: string;
  subtext: string;
  icon: string;
  status: 'idle' | 'running' | 'completed';
  tokenInfo?: string;
  order: number;
}

export interface DependencyNode {
  id: string;
  label: string;
  level: string;
  next?: string;
}

export interface DependencyChain {
  nodes: string[];
}

export interface RiskItem {
  id: string;
  name: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Neutral';
  percentage: number;
}

export interface TimelineItem {
  id: string;
  time: string;
  status: 'COMPLETE' | 'IN PROGRESS' | 'QUEUED' | 'PENDING';
  title: string;
}

export interface TaskItem {
  id: string;
  title: string;
  owner: string;
  initials: string;
  deadline: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ParsedPlan {
  executiveSummary: string;
  dependencyChains: DependencyChain[];
  risks: RiskItem[];
  timeline: TimelineItem[];
  tasks: TaskItem[];
}
