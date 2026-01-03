export interface FraudCheckRequestedEvent {
  transactionId: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  deviceId: string;
  timestamp: number;
}

export interface FraudCheckResultEvent {
  transactionId: string;
  riskScore: number;
  passed: boolean;
  reasons: string[];
}
