'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldInput } from './field-input';
import { Plus, Trash2 } from 'lucide-react';
import type { RetirementPlanningData, PlanningSection } from '@/lib/content/types';

interface Props {
  data: RetirementPlanningData;
  onChange: (data: RetirementPlanningData) => void;
}

export function RetirementPlanningEditor({ data, onChange }: Props) {
  const update = (field: keyof RetirementPlanningData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateSection = (index: number, field: keyof PlanningSection, value: any) => {
    const sections = [...(data.sections || [])];
    sections[index] = { ...sections[index], [field]: value };
    update('sections', sections);
  };

  const addSection = () => {
    const newSection: PlanningSection = {
      _key: `sec-${Date.now()}`,
      title: '',
      content: [],
    };
    update('sections', [...(data.sections || []), newSection]);
  };

  const removeSection = (index: number) => {
    update('sections', (data.sections || []).filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Hero Section</h3>
        <div className="space-y-4">
          <FieldInput label="Hero Title" value={data.heroTitle} onChange={(v) => update('heroTitle', v)} />
          <FieldInput label="Features Title" value={data.featuresTitle} onChange={(v) => update('featuresTitle', v)} />
          <FieldInput label="CTA Button Text" value={data.ctaButtonText} onChange={(v) => update('ctaButtonText', v)} />
          <FieldInput label="Hero Video URL" value={data.heroVideoUrl} onChange={(v) => update('heroVideoUrl', v)} type="url" />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Planning Sections ({(data.sections || []).length})</h3>
        <Button onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Section
        </Button>
      </div>

      {(data.sections || []).map((section, idx) => (
        <Card key={section._key} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">{section.title || 'Untitled Section'}</h4>
            <Button variant="ghost" size="sm" onClick={() => removeSection(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <FieldInput label="Title" value={section.title} onChange={(v) => updateSection(idx, 'title', v)} />
        </Card>
      ))}
    </div>
  );
}
