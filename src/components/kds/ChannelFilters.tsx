'use client';

import { Button } from '@/components/ui/button';

interface ChannelFiltersProps {
  selected: string | null;
  onChange: (channel: string | null) => void;
}

const channels = [
  { value: null, label: 'Todos' },
  { value: 'counter', label: 'Mostrador' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'rappi', label: 'Rappi' },
  { value: 'other', label: 'Otros' },
];

export function ChannelFilters({ selected, onChange }: ChannelFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((channel) => (
        <Button
          key={channel.label}
          type="button"
          size="sm"
          variant={selected === channel.value ? 'default' : 'ghost'}
          onClick={() => onChange(channel.value)}
        >
          {channel.label}
        </Button>
      ))}
    </div>
  );
}
