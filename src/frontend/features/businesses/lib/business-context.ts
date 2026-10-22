import { createContext } from 'react';
import type { BusinessDetailResponseType } from '../types';

/**
 * The business the app shell has loaded. Provided by BusinessGate only once the business is ready,
 * so every screen under it reads one consistent business — even mid-switch, while the next one loads.
 */
export const BusinessContext = createContext<BusinessDetailResponseType | null>(null);
