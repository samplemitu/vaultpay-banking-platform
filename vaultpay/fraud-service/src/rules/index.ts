import { HighAmountRule } from './high-amount-rule';
import { RapidTransferRule } from './rapid-transfer-rule';
import { DeviceMismatchRule } from './device-mismatch-rule';
import { BaseRule } from './base-rule';

export const rules: BaseRule[] = [
  new HighAmountRule(),
  new RapidTransferRule(),
  new DeviceMismatchRule(),
];
