'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PosProduct } from '@/lib/pos/types';
import { usePosStore } from '@/lib/pos/store';

interface SearchBarProps {
  catalog: PosProduct[];
}

export function SearchBar({ catalog }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const addProduct = usePosStore((state) => state.addProduct);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return catalog
      .filter((product) => product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [catalog, query]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar por nombre o SKU"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus
      />
      {results.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-slate-900/90 p-2 shadow-lg">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Resultados ({results.length})</p>
          <div className="grid gap-2">
            {results.map((product) => (
              <Button key={product.sku} variant="ghost" className="justify-between" onClick={() => addProduct(product)}>
                <span>
                  <span className="font-medium">{product.name}</span>
                  <span className="ml-2 text-xs uppercase text-slate-400">{product.sku}</span>
                </span>
                <span className="text-sm text-amber-200">${(product.price / 100).toFixed(2)}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
