import type { Decision, DecisionInput } from "../contracts.js";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function decideOutcome(input: DecisionInput): Decision {
  const beforeIds = new Set(input.before.violations.map((violation) => violation.id));
  const afterIds = new Set(input.after.violations.map((violation) => violation.id));
  const unresolvedViolationIds = uniqueSorted(input.targetViolationIds.filter((id) => afterIds.has(id)));
  const newViolationIds = uniqueSorted([...afterIds].filter((id) => !beforeIds.has(id)));
  const failedGates = input.regressionGates.filter((gate) => !gate.passed);

  if (failedGates.length > 0 || newViolationIds.length > 0) {
    return {
      status: "REGRESSION_BLOCKED",
      summary: "The proposed repair introduced or failed a regression gate and was not accepted.",
      unresolvedViolationIds,
      newViolationIds,
      regressionGates: input.regressionGates
    };
  }

  if (unresolvedViolationIds.length > 0) {
    return {
      status: "HUMAN_REVIEW_REQUIRED",
      summary: "Automated evidence could not verify every targeted repair.",
      unresolvedViolationIds,
      newViolationIds,
      regressionGates: input.regressionGates
    };
  }

  return {
    status: "VERIFIED_FIXED",
    summary: "Every targeted automated barrier is absent and all regression gates passed.",
    unresolvedViolationIds,
    newViolationIds,
    regressionGates: input.regressionGates
  };
}
