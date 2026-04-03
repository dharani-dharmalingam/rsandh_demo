'use client';

import { Card } from '@/components/ui/card';
import { FieldInput } from './field-input';
import { SectionHeader } from './section-header';
import type { OpenEnrollmentData } from '@/lib/content/types';

interface Props {
  data: OpenEnrollmentData;
  onChange: (data: OpenEnrollmentData) => void;
}

export function OpenEnrollmentEditor({ data, onChange }: Props) {
  const update = (field: keyof OpenEnrollmentData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Open Enrollment"
        description="Set enrollment dates, links, and UI label text shown to employees."
      />
      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">General</h3>
        <div className="space-y-4">
          <FieldInput label="Title" value={data.title} onChange={(v) => update('title', v)} />
          <FieldInput label="Description" value={data.description} onChange={(v) => update('description', v)} type="textarea" />
        </div>
      </Card>

      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Dates & Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldInput label="Start Date" value={data.startDate} onChange={(v) => update('startDate', v)} type="datetime-local" />
          <FieldInput label="End Date" value={data.endDate} onChange={(v) => update('endDate', v)} type="datetime-local" />
          <FieldInput label="Enrollment Link" value={data.enrollmentLink} onChange={(v) => update('enrollmentLink', v)} type="url" />
          <FieldInput label="Benefits Guide URL" value={data.benefitsGuideUrl} onChange={(v) => update('benefitsGuideUrl', v)} type="url" />
          <FieldInput label="Video URL" value={data.videoUrl} onChange={(v) => update('videoUrl', v)} type="url" />
        </div>
      </Card>

      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">UI Labels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldInput label="Days Left Label" value={data.daysLeftLabel} onChange={(v) => update('daysLeftLabel', v)} placeholder="Days Left" />
          <FieldInput label="Period Label" value={data.periodLabel} onChange={(v) => update('periodLabel', v)} placeholder="Open Enrollment Period" />
          <FieldInput label="Status Title" value={data.statusTitle} onChange={(v) => update('statusTitle', v)} placeholder="Action Needed" />
          <FieldInput label="Status Description" value={data.statusDescription} onChange={(v) => update('statusDescription', v)} />
          <FieldInput label="Checklist Label" value={data.checklistLabel} onChange={(v) => update('checklistLabel', v)} />
          <FieldInput label="Checklist Subtext" value={data.checklistSubtext} onChange={(v) => update('checklistSubtext', v)} />
          <FieldInput label="Changes Label" value={data.changesLabel} onChange={(v) => update('changesLabel', v)} />
          <FieldInput label="Changes Subtext" value={data.changesSubtext} onChange={(v) => update('changesSubtext', v)} />
          <FieldInput label="Enroll Label" value={data.enrollLabel} onChange={(v) => update('enrollLabel', v)} />
          <FieldInput label="Enroll Subtext" value={data.enrollSubtext} onChange={(v) => update('enrollSubtext', v)} />
        </div>
      </Card>
    </div>
  );
}
