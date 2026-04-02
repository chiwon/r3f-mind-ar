import { createContext, useContext } from 'react';
import type { ARContextValue } from './types';

export const ARContext = createContext<ARContextValue | null>(null);

export function useAR(): ARContextValue {
  const context = useContext(ARContext);
  if (!context) {
    throw new Error('useAR must be used within an <ARView> component');
  }
  return context;
}
