export interface FraudContext {
  userId: string;
  amount: number;
  deviceId: string;
  timestamp: number;
}

export interface FraudRuleResult {
  risk: number;       // 0–100
  reason?: string;
}

export abstract class BaseRule {
  abstract evaluate(ctx: FraudContext): Promise<FraudRuleResult>;
}
