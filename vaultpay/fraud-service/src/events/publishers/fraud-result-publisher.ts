import { FraudCheckResultEvent } from '../events';
import { natsWrapper } from '../../nats-wrapper';

export class FraudResultPublisher {
  static subject = 'fraud.result';

  static async publish(data: FraudCheckResultEvent) {
    await natsWrapper.jetstream.publish(
      this.subject,
      Buffer.from(JSON.stringify(data))
    );
  }
}
