import { Request, Response } from 'express';
import fetch, { RequestInit } from 'node-fetch';
import { config } from '../config/env';

const serviceMap: Record<string, string> = {
  auth: config.services.auth,
  account: config.services.account,
  transaction: config.services.transaction,
  fraud: config.services.fraud,
  audit: config.services.audit,
};

export class ProxyService {
  static async proxyTo(
    service: keyof typeof serviceMap,
    req: Request,
    res: Response
  ) {
    const baseUrl = serviceMap[service];
    const url = baseUrl + req.originalUrl.replace(/^\/api\/v1\//, '/');

    const headers: any = {
      ...req.headers,
      host: undefined, // don't forward gateway host
      cookie: undefined, // 🚫 do not leak browser cookies

      'x-correlation-id': (req as any).correlationId,
      'x-user-id': (req as any).currentUser?.userId || '',
      'x-user-role': (req as any).currentUser?.role || '',
      'x-device-id': (req as any).currentUser?.deviceId || '',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 🕒 5 sec timeout

    const init: RequestInit = {
      method: req.method,
      headers,
      signal: controller.signal,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    try {
      const upstreamRes = await fetch(url, init);
      clearTimeout(timeout);

      const text = await upstreamRes.text();
      res.status(upstreamRes.status);

      try {
        return res.json(JSON.parse(text));
      } catch {
        return res.send(text);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return res.status(504).json({ error: 'Upstream timeout' });
      }
      console.error('Proxy error:', err);
      return res.status(502).json({ error: 'Bad gateway' });
    }
  }
}
