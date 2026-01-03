import { TransactionInitiatedEvent } from './events';
// import publishers tomorrow

export class TransactionOrchestrator {

  static async start(data: TransactionInitiatedEvent) {
    // 1. Publish transaction.initiated event
    // await TransactionInitiatedPublisher.publish(data);

    console.log('Saga started:', data);

    // Orchestrator continues when ACCT + FRAUD services respond to events
  }

  // handle debit success
  static async onDebitCompleted(event: any) {
    console.log('Debit completed', event);

    // publish fraud.check.requested
  }

  // handle fraud pass
  static async onFraudPassed(event: any) {
    console.log('Fraud passed', event);

    // publish credit.requested
  }

  // handle fraud fail
  static async onFraudFailed(event: any) {
    console.log('Fraud failed', event);

    // publish transaction.failed
  }

  // handle credit success
  static async onCreditCompleted(event: any) {
    console.log('Credit completed', event);

    // publish transaction.completed
  }
}
