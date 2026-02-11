/**
 * Request Helper
 * Creates NextRequest objects for testing API routes
 */

import { NextRequest } from 'next/server';

/**
 * Create a NextRequest for testing
 * @param url Full URL including query params
 * @param options Optional init (method, body, headers)
 */
export function createRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, any>;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

/**
 * Create route context with params (Next.js 16: params is a Promise)
 */
export function createContext(params: Record<string, string>) {
  return {
    params: Promise.resolve(params),
  };
}
