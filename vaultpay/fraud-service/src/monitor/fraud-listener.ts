import { FraudEvaluator } from './fraud-evaluator';
import { FraudResultPublisher } from '../events/publishers/fraud-result-publisher';
import { FraudCheckRequestedEvent } from '../events/events';
import { natsWrapper } from '../nats-wrapper';

export class FraudListener {
  static async listen() {
    const js = natsWrapper.jetstream;

    const sub = await js.subscribe('fraud.check.requested');

    for await (const msg of sub) {
      const event = JSON.parse(msg.data.toString()) as FraudCheckRequestedEvent;

      const result = await FraudEvaluator.evaluate({
        userId: event.userId,
        amount: event.amount,
        deviceId: event.deviceId,
        timestamp: event.timestamp,
      });

      await FraudResultPublisher.publish({
        transactionId: event.transactionId,
        ...result,
      });

      msg.ack();
    }
  }
}
