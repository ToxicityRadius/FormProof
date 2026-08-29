export type AdapterId = "static" | "react" | "vue" | "angular" | "flask" | "unknown";
export type DecisionStatus = "VERIFIED_FIXED" | "REGRESSION_BLOCKED" | "HUMAN_REVIEW_REQUIRED";
export type Impact = "minor" | "moderate" | "serious" | "critical" | "unknown";

export interface SourceCandidate {
  path: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface ViolationNode {
  target: string[];
  html: string;
  failureSummary: string;
  sourceCandidates: SourceCandidate[];
}

export interface AuditViolation {
  id: string;
  impact: Impact;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: ViolationNode[];
}

export interface ScanEvidence {
  schemaVersion: "1.0";
  runId: string;
  capturedAt: string;
  target: {
    url: string;
    sourceRoot: string;
    adapter: AdapterId;
  };
  violations: AuditViolation[];
  totals: {
    violations: number;
    nodes: number;
  };
}

export interface RegressionGate {
  name: string;
  passed: boolean;
  details: string;
}

export interface Decision {
  status: DecisionStatus;
  summary: string;
  unresolvedViolationIds: string[];
  newViolationIds: string[];
  regressionGates: RegressionGate[];
}

export interface DecisionInput {
  before: ScanEvidence;
  after: ScanEvidence;
  targetViolationIds: string[];
  regressionGates: RegressionGate[];
}

export interface ReportInput {
  before: ScanEvidence;
  after?: ScanEvidence;
  decision: Decision;
}
