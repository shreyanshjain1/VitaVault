export async function evaluateAlertRules() {
  return {
    evaluatedRuleCount: 0,
    createdAlertCount: 0,
    createdAlertIds: [] as string[],
  };
}