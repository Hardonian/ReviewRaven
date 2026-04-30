// Migration note: Vended from WarrantyWeasel shared-intelligence v1.0.0
// Failure registry - known failure scenarios and their handling

export interface FailureScenario {
  id: string;
  scenario: string;
  trigger: string;
  expectedBehavior: string;
  userMessage: string;
  confidenceImpact: number;
}

export const sharedFailureScenarios: FailureScenario[] = [
  { id: 'FS-01', scenario: 'DOM Mutation', trigger: 'Selector changes', expectedBehavior: 'Fallback to heuristics', userMessage: 'We are updating our connection to the platform.', confidenceImpact: -100 },
  { id: 'FS-02', scenario: 'Rate Limit 429', trigger: 'IP-based threshold', expectedBehavior: 'Exponential backoff', userMessage: 'Analysis is taking longer than usual due to high traffic.', confidenceImpact: -10 },
  { id: 'FS-04', scenario: 'Captcha Shadow Block', trigger: 'Captcha served to scraper', expectedBehavior: 'Rotate proxy or switch path', userMessage: 'Platform security is high. We are trying an alternative path.', confidenceImpact: -100 },
  { id: 'FS-16', scenario: 'WAF Block 403', trigger: 'Web App Firewall blocks', expectedBehavior: 'Switch IP geoloc', userMessage: 'Taking a quick breath to bypass congestion.', confidenceImpact: -100 },
  { id: 'FS-33', scenario: 'Empty Page 200 OK', trigger: 'Out of stock page', expectedBehavior: 'Log as inactive', userMessage: 'Product is currently unavailable for analysis.', confidenceImpact: -100 },
  { id: 'FS-50', scenario: 'Zero Reviews', trigger: 'No review data', expectedBehavior: 'Return UNKNOWN', userMessage: 'This product has no reviews yet.', confidenceImpact: 0 },
];

export function findFailureScenario(id: string): FailureScenario | undefined {
  return sharedFailureScenarios.find(s => s.id === id);
}

export function getFailureUserMessage(id: string): string {
  const scenario = findFailureScenario(id);
  return scenario?.userMessage || 'Analysis encountered an issue.';
}
