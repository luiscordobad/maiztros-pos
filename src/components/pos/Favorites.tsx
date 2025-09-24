'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { PosProduct } from '@/lib/pos/types';
import { usePosStore } from '@/lib/pos/store';

interface FavoritesProps {
  products: PosProduct[];
}

export function Favorites({ products }: FavoritesProps) {
  const addProduct = usePosStore((state) => state.addProduct);

  const grouped = useMemo(() => {
    const categories = new Map<string, PosProduct[]>();
    products.forEach((product) => {
      const list = categories.get(product.category) ?? [];
      list.push(product);
      categories.set(product.category, list);
    });
    return Array.from(categories.entries());
  }, [products]);

  return (
    <div className="space-y-4">
      {grouped.map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{category}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <Button key={product.sku} variant="secondary" className="justify-between" onClick={() => addProduct(product)}>
                <span>{product.name}</span>
                <span className="text-sm text-amber-200">${(product.price / 100).toFixed(2)}</span>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
