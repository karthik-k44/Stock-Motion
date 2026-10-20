import { useSyncExternalStore } from 'react';
import { motionPreference } from '@/frontend/lib/motion-preference';

/** `reduced` is true when the user chose "Off" or the OS asks for reduced motion under "System". */
export const useMotion = () => {
  const snapshot = useSyncExternalStore(motionPreference.Subscribe, motionPreference.Get);
  return { ...snapshot, setPreference: motionPreference.Set };
};
