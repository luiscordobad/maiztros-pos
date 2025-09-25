'use client';

import { addDays, formatISO, parseISO } from 'date-fns';
import { useState } from 'react';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface DateRangeValue {
  from: string; // ISO date string (start of day)
  to: string;   // ISO date string (end of day)
}

interface PresetOption {
  label: string;
  value: string;
  range: (now: Date) => DateRangeValue;
}

const presets: PresetOption[] = [
  {
    label: 'Hoy',
    value: 'today',
    range: (now) => {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const end = addDays(start, 1);
      return { from: start.toISOString(), to: end.toISOString() };
    },
  },
  {
    label: 'Últimos 7 días',
    value: 'last7',
    range: (now) => {
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const start = addDays(end, -7);
      return { from: start.toISOString(), to: end.toISOString() };
    },
  },
  {
    label: 'Últimos 30 días',
    value: 'last30',
    range: (now) => {
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const start = addDays(end, -30);
      return { from: start.toISOString(), to: end.toISOString() };
    },
  },
];

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [preset, setPreset] = useState<string>('custom');

  const onPresetChange = (newValue: string) => {
    setPreset(newValue);
    const option = presets.find((p) => p.value === newValue);
    if (option) {
      const next = option.range(new Date());
      onChange(next);
    }
  };

  const onDateInput = (key: 'from' | 'to') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (!nextValue) return;
    const iso = formatISO(parseISO(nextValue));
    onChange({ ...value, [key]: iso });
    setPreset('custom');
  };

  const formatForInput = (iso: string) => iso.slice(0, 10);

  return (
    <div className="space-y-2">
      <Label>Rango de fechas</Label>
      <div className="grid gap-2 md:grid-cols-3">
        <Select value={preset} onChange={(event) => onPresetChange(event.target.value)}>
          <option value="custom">Personalizado</option>
          {presets.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <input
          type="date"
          className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          value={formatForInput(value.from)}
          onChange={onDateInput('from')}
        />
        <input
          type="date"
          className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          value={formatForInput(value.to)}
          onChange={onDateInput('to')}
        />
      </div>
    </div>
  );
}
