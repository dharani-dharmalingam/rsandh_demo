'use client';

import { Card } from '@/components/ui/card';
import { FieldInput } from './field-input';
import { SectionHeader } from './section-header';
import type { SiteSettingsData, ClientData } from '@/lib/content/types';

interface Props {
  data: SiteSettingsData;
  clientData: ClientData;
  onChange: (data: SiteSettingsData) => void;
  onClientChange: (data: ClientData) => void;
}

export function SiteSettingsEditor({ data, clientData, onChange, onClientChange }: Props) {
  const update = (field: keyof SiteSettingsData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateClient = (field: keyof ClientData, value: any) => {
    onClientChange({ ...clientData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Site Settings"
        description="Configure client identity, branding, and footer content."
      />
      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Client Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldInput
            label="Company Name"
            value={clientData.name}
            onChange={(v) => updateClient('name', v)}
          />
          <FieldInput
            label="Slug"
            value={clientData.slug}
            onChange={(v) => updateClient('slug', v)}
            description="URL-safe identifier (e.g., acme-corp)"
          />
          <FieldInput
            label="Theme Color"
            value={clientData.themeColor}
            onChange={(v) => updateClient('themeColor', v)}
            placeholder="#0B5FFF"
          />
        </div>
      </Card>

      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldInput
            label="Client Name (Display)"
            value={data.clientName}
            onChange={(v) => update('clientName', v)}
          />
          <FieldInput
            label="Short Name / Initials"
            value={data.shortName}
            onChange={(v) => update('shortName', v)}
          />
          <FieldInput
            label="Logo Text"
            value={data.logoText}
            onChange={(v) => update('logoText', v)}
          />
          <FieldInput
            label="Logo URL"
            value={data.clientLogo}
            onChange={(v) => update('clientLogo', v)}
            type="url"
            placeholder="https://... or /images/logo.png"
          />
        </div>
      </Card>

      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Footer</h3>
        <div className="space-y-4">
          <FieldInput
            label="Footer About Text"
            value={data.footerAbout}
            onChange={(v) => update('footerAbout', v)}
            type="textarea"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput
              label="Footer Contact Title"
              value={data.footerContactTitle}
              onChange={(v) => update('footerContactTitle', v)}
            />
            <FieldInput
              label="Copyright Text"
              value={data.copyrightText}
              onChange={(v) => update('copyrightText', v)}
            />
          </div>
          <FieldInput
            label="Footer Contact Description"
            value={data.footerContactDescription}
            onChange={(v) => update('footerContactDescription', v)}
            type="textarea"
          />
        </div>
      </Card>
    </div>
  );
}
