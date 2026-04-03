'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldInput } from './field-input';
import { SectionHeader } from './section-header';
import { Plus, Trash2 } from 'lucide-react';
import type { EnrollmentChecklistData, ChecklistItem } from '@/lib/content/types';

interface Props {
  data: EnrollmentChecklistData;
  onChange: (data: EnrollmentChecklistData) => void;
}

export function EnrollmentChecklistEditor({ data, onChange }: Props) {
  const update = (field: keyof EnrollmentChecklistData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const items = [...(data.items || [])];
    items[index] = { ...items[index], [field]: value };
    update('items', items);
  };

  const addItem = () => {
    const newItem: ChecklistItem = {
      _key: `item-${Date.now()}`,
      step: (data.items || []).length + 1,
      title: '',
      description: [],
    };
    update('items', [...(data.items || []), newItem]);
  };

  const removeItem = (index: number) => {
    update('items', (data.items || []).filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Enrollment Checklist"
        description="Define the step-by-step checklist employees follow during enrollment."
      />
      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Page Settings</h3>
        <div className="space-y-4">
          <FieldInput label="Title" value={data.title} onChange={(v) => update('title', v)} />
          <FieldInput label="CTA Title" value={data.ctaTitle} onChange={(v) => update('ctaTitle', v)} />
          <FieldInput label="CTA Description" value={data.ctaDescription} onChange={(v) => update('ctaDescription', v)} type="textarea" />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Checklist Items ({(data.items || []).length})</h3>
        <Button onClick={addItem} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {(data.items || []).map((item, idx) => (
        <Card key={item._key} className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Step {item.step}: {item.title || 'Untitled'}</h4>
            <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldInput
              label="Step Number"
              value={item.step?.toString()}
              onChange={(v) => updateItem(idx, 'step', parseInt(v) || 0)}
              type="number"
            />
            <div className="md:col-span-2">
              <FieldInput label="Title" value={item.title} onChange={(v) => updateItem(idx, 'title', v)} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
