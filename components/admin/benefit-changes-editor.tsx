'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldInput } from './field-input';
import { Plus, Trash2 } from 'lucide-react';
import type { BenefitChangesPageData, BenefitChange } from '@/lib/content/types';

interface Props {
  data: BenefitChangesPageData;
  onChange: (data: BenefitChangesPageData) => void;
}

export function BenefitChangesEditor({ data, onChange }: Props) {
  const update = (field: keyof BenefitChangesPageData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateChange = (index: number, field: keyof BenefitChange, value: any) => {
    const changes = [...(data.changes || [])];
    changes[index] = { ...changes[index], [field]: value };
    update('changes', changes);
  };

  const addChange = () => {
    const newChange: BenefitChange = {
      _key: `chg-${Date.now()}`,
      type: 'new',
      title: '',
      description: [],
    };
    update('changes', [...(data.changes || []), newChange]);
  };

  const removeChange = (index: number) => {
    update('changes', (data.changes || []).filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Page Header</h3>
        <div className="space-y-4">
          <FieldInput label="Title" value={data.title} onChange={(v) => update('title', v)} />
          <FieldInput label="CTA Title" value={data.ctaTitle} onChange={(v) => update('ctaTitle', v)} />
          <FieldInput label="CTA Description" value={data.ctaDescription} onChange={(v) => update('ctaDescription', v)} type="textarea" />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Changes ({(data.changes || []).length})</h3>
        <Button onClick={addChange} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Change
        </Button>
      </div>

      {(data.changes || []).map((change, idx) => (
        <Card key={change._key} className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">{change.title || 'Untitled Change'}</h4>
            <Button variant="ghost" size="sm" onClick={() => removeChange(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput label="Title" value={change.title} onChange={(v) => updateChange(idx, 'title', v)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                value={change.type}
                onChange={(e) => updateChange(idx, 'type', e.target.value)}
              >
                <option value="new">New</option>
                <option value="update">Update</option>
              </select>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
