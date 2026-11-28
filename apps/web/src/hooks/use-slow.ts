import { useEffect, useState } from 'react';

/** True when `pending` has lasted longer than `ms` (to explain a slow wait). */
export function useSlow(pending: boolean, ms = 4000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) return setSlow(false);
    const timer = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(timer);
  }, [pending, ms]);
  return slow;
}
