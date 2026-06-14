import { ParsedPlan } from './types';

export interface PresetMeeting {
  id: string;
  name: string;
  transcript: string;
  plan: ParsedPlan;
}

// A complete, multi-speaker sample transcript that exercises the full agent
// swarm (Extraction → Risk → Assignment → Reporting → Validation): explicit
// owners, deadlines, a dependency, and a stated risk.
export const SAMPLE_TRANSCRIPT = `Sarah: Morning everyone, let's plan the v2 launch sprint. We have three weeks.
Raj: I'll take the payments integration with Stripe. That's the critical path — it needs to be done before we can start the checkout redesign.
Sarah: Good. When can you have it ready?
Raj: Payments should be done by next Friday. There's a risk though — Stripe's webhook signing changed in their latest API version, so we may need extra time to handle the migration.
Priya: I'll own the checkout redesign. I can start once Raj's payments work lands, so probably the week after.
Sarah: Perfect. Tom, can you handle the load testing?
Tom: Yes, I'll set up load testing. I need the staging environment first though — that's blocking me.
Sarah: I'll get DevOps to provision staging by Wednesday. Let's also make sure we write the migration docs before launch.
Priya: I can draft the migration docs by end of sprint.
Sarah: Great, that's our plan.`

export const SAMPLE_MEETING_ID = 'Sample_Sprint_V2'

export const PRESET_MEETINGS: PresetMeeting[] = [
  {
    id: 'Meeting_ID_4920',
    name: 'Q3 Rollout & DevOps Alignment',
    transcript: `"The project scope for the Q4 rollout has been updated. We need to focus on the migration of the legacy data clusters by mid-October. Sarah, could you handle the validation of the new encryption layers? We've seen some latency issues in the staging environment that might indicate a conflict with the current load balancer settings. Let's schedule a deep dive for Tuesday. Risk assessment should include potential downtime windows for the APAC region..."`,
    plan: {
      executiveSummary: 'Q3 operational efficiency has increased by 14% across all high-performance modules. The primary bottleneck in the supply chain (Agent-7) has been successfully resolved through automated resource reallocation. Current project health is Stable, with 92% of tasks on track for the EOM deadline. Risks are localized to Tier-3 dependencies.',
      dependencyChains: [
        { nodes: ['L1: Core Infra', 'L2: DB Sync', 'L3: API Edge'] },
        { nodes: ['L1: Auth Module', 'L2: OAuth 2.0'] }
      ],
      risks: [
        { id: 'risk1', name: 'Team Alpha (Sarah)', riskLevel: 'Low', percentage: 25 },
        { id: 'risk2', name: 'DevOps (James)', riskLevel: 'High', percentage: 85 },
        { id: 'risk3', name: 'Product (Elena)', riskLevel: 'Neutral', percentage: 50 }
      ],
      timeline: [
        { id: 't1', time: '08:00 AM', status: 'COMPLETE', title: 'Environment Provisioning' },
        { id: 't2', time: '10:30 AM', status: 'COMPLETE', title: 'Automated Regression Suite' },
        { id: 't3', time: '02:15 PM', status: 'IN PROGRESS', title: 'Production Hotfix Deployment' }
      ],
      tasks: [
        { id: '01', title: 'Integrate GPT-4 Vision Engine', owner: 'J. Doe', initials: 'JD', deadline: 'Oct 24', risk: 'LOW' },
        { id: '02', title: 'Optimize Vector Embedding', owner: 'A. Smith', initials: 'AS', deadline: 'Oct 25', risk: 'MEDIUM' },
        { id: '03', title: 'Cloud Migration Phase 2', owner: 'M. Chen', initials: 'MC', deadline: 'OVERDUE', risk: 'HIGH' }
      ]
    }
  },
  {
    id: 'Meeting_ID_5112',
    name: 'Security Leak Audit',
    transcript: `"We found some credentials embedded in the client bundle. We need to immediately invalidate all OAuth tokens, migrate secrets to Google Cloud Secret Manager, and implement server-side proxies for all Gemini API keys. Mark, you will handle the transition of keys. Joe, please verify the webhook security and update the passport-js rules before Friday. David, let's schedule an emergency penetration test."`,
    plan: {
      executiveSummary: 'Critical security audit triggered by a potential client-side credential exposure. Remediation mandates migration of all sensitive keys and tokens server-side. Immediate action required on OAuth invalidation and proxy deployment.',
      dependencyChains: [
        { nodes: ['L1: Secret Store', 'L2: Proxy API API', 'L3: Client Bundle Refresh'] },
        { nodes: ['L1: OAuth Revoke', 'L2: Webhook Guard'] }
      ],
      risks: [
        { id: 'risk1', name: 'Credentials Leakage', riskLevel: 'High', percentage: 95 },
        { id: 'risk2', name: 'API Key Exposure', riskLevel: 'High', percentage: 80 },
        { id: 'risk3', name: 'Downtime for Token Reset', riskLevel: 'Medium', percentage: 40 }
      ],
      timeline: [
        { id: 't1', time: '09:00 AM', status: 'COMPLETE', title: 'Audit Alert Triggered' },
        { id: 't2', time: '11:15 AM', status: 'COMPLETE', title: 'Secrets Rotated in Production' },
        { id: 't3', time: '04:00 PM', status: 'IN PROGRESS', title: 'Validating Proxy Refactors' }
      ],
      tasks: [
        { id: '01', title: 'Migrate keys to Google Cloud Secret Manager', owner: 'Mark R.', initials: 'MR', deadline: 'Oct 15', risk: 'HIGH' },
        { id: '02', title: 'Implement Express API proxy for Gemini', owner: 'Joe S.', initials: 'JS', deadline: 'Oct 16', risk: 'HIGH' },
        { id: '03', title: 'Emergency Pentest Session', owner: 'David K.', initials: 'DK', deadline: 'Oct 18', risk: 'MEDIUM' }
      ]
    }
  },
  {
    id: 'Meeting_ID_3092',
    name: 'APAC Scale & Global Launch',
    transcript: `"The APAC region needs tailored CDN routing to reduce latency. We're getting 350ms in Tokyo compared to 45ms in Oregon. Elena, could you analyze the cluster load in APAC? James, we need multi-region replication set up on Firestore. Let's make sure the database rules are tested against latency delays."`,
    plan: {
      executiveSummary: 'APAC market scale operations require localized proxy layers and geographical replication of database nodes. Real-time synchronizations must operate within safe 50ms limits to satisfy regional service agreements.',
      dependencyChains: [
        { nodes: ['L1: Multi-region DB', 'L2: CDN Edge Node', 'L3: APAC Ingress Gateway'] },
        { nodes: ['L1: Regional DNS Route', 'L2: Health Check Sync'] }
      ],
      risks: [
        { id: 'risk1', name: 'Latency Drift (APAC)', riskLevel: 'High', percentage: 70 },
        { id: 'risk2', name: 'Data Inconsistency', riskLevel: 'Medium', percentage: 45 },
        { id: 'risk3', name: 'Billing Limit Thresholds', riskLevel: 'Low', percentage: 15 }
      ],
      timeline: [
        { id: 't1', time: '06:30 AM', status: 'COMPLETE', title: 'Analyze Tokyo Cluster Load' },
        { id: 't2', time: '09:00 AM', status: 'COMPLETE', title: 'Deploy Tokyo CDN Nodes' },
        { id: 't3', time: '01:00 PM', status: 'IN PROGRESS', title: 'Set up Multi-Region Replication' }
      ],
      tasks: [
        { id: '01', title: 'CDN Route Optimization (APAC)', owner: 'Elena V.', initials: 'EV', deadline: 'Oct 10', risk: 'MEDIUM' },
        { id: '02', title: 'Deploy Tokyo Ingress Gateway', owner: 'James T.', initials: 'JT', deadline: 'Oct 12', risk: 'HIGH' },
        { id: '03', title: 'Test geographic replication rules', owner: 'Sarah W.', initials: 'SW', deadline: 'Oct 14', risk: 'LOW' }
      ]
    }
  }
];
