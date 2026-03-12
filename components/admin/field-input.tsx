'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FieldInputProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'url' | 'email' | 'datetime-local' | 'number';
  placeholder?: string;
  description?: string;
}

export function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  description,
}: FieldInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {type === 'textarea' ? (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <Input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
