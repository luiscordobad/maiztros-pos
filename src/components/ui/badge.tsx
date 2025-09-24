import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border border-amber-400/70 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-200', className)}
      {...props}
    />
  );
}
