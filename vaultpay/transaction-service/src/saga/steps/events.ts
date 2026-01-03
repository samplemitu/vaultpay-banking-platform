export interface TransactionInitiatedEvent {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  idempotencyKey: string;
}

export interface DebitCompletedEvent {
  transactionId: string;
  fromAccountId: string;
  amount: number;
}

export interface CreditCompletedEvent {
  transactionId: string;
  toAccountId: string;
  amount: number;
}

export interface FraudCheckPassedEvent {
  transactionId: string;
}

export interface FraudCheckFailedEvent {
  transactionId: string;
  reason: string;
}
