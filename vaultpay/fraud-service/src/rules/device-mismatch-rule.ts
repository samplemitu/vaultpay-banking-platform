import { BaseRule, FraudContext, FraudRuleResult } from './base-rule';
import fetch from 'node-fetch';

export class DeviceMismatchRule extends BaseRule {
  async evaluate(ctx: FraudContext): Promise<FraudRuleResult> {
    const res = await fetch(
      `${process.env.AUTH_SERVICE_URL}/internal/devices/${ctx.userId}`
    );
    const data = await res.json();

    const knownDevices = data.devices || [];

    if (!knownDevices.includes(ctx.deviceId)) {
      return {
        risk: 80,
        reason: 'Device not recognized',
      };
    }

    return { risk: 0 };
  }
}
