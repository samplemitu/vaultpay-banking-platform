export interface GatewayRequestLoggedEvent {
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  userId?: string | null;
  role?: string | null;
  durationMs: number;
}
