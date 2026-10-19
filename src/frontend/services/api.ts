import axios from 'axios';
import { sessionState } from './session-state';

/** The one axios instance. Features never use it directly — see `request.ts`. */
export const httpClient = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  config.headers.set('x-user-id', sessionState.GetActingUserId());
  return config;
});
