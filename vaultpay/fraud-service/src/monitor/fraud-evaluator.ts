import { FraudContext } from '../rules/base-rule';
import { rules } from '../rules';

export class FraudEvaluator {
  static async evaluate(ctx: FraudContext) {
    let totalRisk = 0;
    const reasons: string[] = [];

    for (const rule of rules) {
      const result = await rule.evaluate(ctx);
      totalRisk += result.risk;

      if (result.reason) {
        reasons.push(result.reason);
      }
    }

    return {
      riskScore: Math.min(totalRisk, 100), // cap at 100
      reasons,
      passed: totalRisk < 50, // threshold (configurable)
    };
  }
}
