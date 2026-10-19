import { useEffect, useState } from 'react';
import { realtime } from '@/frontend/services/socket';

/** Whether the realtime link is up (without subscribing to data events like `useRealtime`). */
export function useConnection(): boolean {
  const [connected, setConnected] = useState(realtime.IsConnected());
  useEffect(() => realtime.OnStatus(setConnected), []);
  return connected;
}
