import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * The item detail drawer is driven by `?item=SKU` so any screen (warehouse,
 * inventory, locations, orders) opens the same panel and the URL is shareable.
 */
export const useItemDrawer = () => {
  const [params, setParams] = useSearchParams();
  const sku = params.get('item');

  const open = useCallback(
    (next: string) =>
      setParams((p) => {
        const copy = new URLSearchParams(p);
        copy.set('item', next);
        return copy;
      }, { preventScrollReset: true }),
    [setParams],
  );

  const close = useCallback(
    () =>
      setParams((p) => {
        const copy = new URLSearchParams(p);
        copy.delete('item');
        return copy;
      }, { preventScrollReset: true }),
    [setParams],
  );

  return { sku, open, close };
};
