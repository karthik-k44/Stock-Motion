import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtime } from '@/frontend/services/socket';

/**
 * Keep every open tab in sync: the server broadcasts which resources of the current business
 * changed, and each one's query keys start with that resource name.
 */
export const useRealtime = () => {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(realtime.IsConnected());

  useEffect(() => {
    realtime.Connect();
    let dropped = false;
    const offStatus = realtime.OnStatus((on) => {
      setConnected(on);
      // Changes made while disconnected were never broadcast here: refetch.
      if (on && dropped) qc.invalidateQueries();
      dropped = !on;
    });
    const offData = realtime.OnDataChanged((e) => {
      e.resources.forEach((resource) => qc.invalidateQueries({ queryKey: [resource] }));
      if (e.resources.includes('business')) qc.invalidateQueries({ queryKey: ['businesses'] });
    });
    return () => {
      offStatus();
      offData();
    };
  }, [qc]);

  return { connected };
};
