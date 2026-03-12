'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Save, Globe, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { SiteSettingsEditor } from '@/components/admin/site-settings-editor';
import { BenefitsEditor } from '@/components/admin/benefits-editor';
import { OpenEnrollmentEditor } from '@/components/admin/open-enrollment-editor';
import { BenefitChangesEditor } from '@/components/admin/benefit-changes-editor';
import { EnrollmentChecklistEditor } from '@/components/admin/enrollment-checklist-editor';
import { RetirementPlanningEditor } from '@/components/admin/retirement-planning-editor';
import { BenefitsImportWizard } from '@/components/admin/benefits-import-wizard';
import type { EmployerContent } from '@/lib/content/types';

export default function AdminPage() {
  const [content, setContent] = useState<EmployerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content?mode=draft');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setContent(json.data);
      setHasDraft(json.hasDraft);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error(await res.text());
      setHasDraft(true);
      setStatus('Draft saved successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!content) return;
    setPublishing(true);
    setStatus(null);
    try {
      await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      const res = await fetch('/api/content?action=publish', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      setHasDraft(false);
      setStatus('Published successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const updateSection = <K extends keyof EmployerContent>(
    key: K,
    value: EmployerContent[K]
  ) => {
    if (!content) return;
    setContent({ ...content, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading content...</span>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600">{error}</p>
          <Button onClick={loadContent} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Content Editor</h1>
            <p className="text-sm text-slate-500">
              {content.siteSettings?.clientName || 'Unknown'} &mdash;{' '}
              {hasDraft ? (
                <span className="text-amber-600 font-medium">Unsaved draft</span>
              ) : (
                <span className="text-green-600 font-medium">Published</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {status}
              </span>
            )}
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="import" className="flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Import
            </TabsTrigger>
            <TabsTrigger value="settings">Site Settings</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="enrollment">Open Enrollment</TabsTrigger>
            <TabsTrigger value="changes">Benefit Changes</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="retirement">Retirement</TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <BenefitsImportWizard
              clientSlug={content.client?.slug || 'unknown'}
              onComplete={() => {
                loadContent();
                setActiveTab('benefits');
              }}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettingsEditor
              data={content.siteSettings}
              clientData={content.client}
              onChange={(settings) => updateSection('siteSettings', settings)}
              onClientChange={(client) => updateSection('client', client)}
            />
          </TabsContent>

          <TabsContent value="benefits">
            <BenefitsEditor
              pageData={content.benefitsPage}
              chapters={content.benefitChapters}
              onPageChange={(page) => updateSection('benefitsPage', page)}
              onChaptersChange={(chapters) => updateSection('benefitChapters', chapters)}
            />
          </TabsContent>

          <TabsContent value="enrollment">
            <OpenEnrollmentEditor
              data={content.openEnrollment}
              onChange={(data) => updateSection('openEnrollment', data)}
            />
          </TabsContent>

          <TabsContent value="changes">
            <BenefitChangesEditor
              data={content.benefitChangesPage}
              onChange={(data) => updateSection('benefitChangesPage', data)}
            />
          </TabsContent>

          <TabsContent value="checklist">
            <EnrollmentChecklistEditor
              data={content.enrollmentChecklist}
              onChange={(data) => updateSection('enrollmentChecklist', data)}
            />
          </TabsContent>

          <TabsContent value="retirement">
            <RetirementPlanningEditor
              data={content.retirementPlanning}
              onChange={(data) => updateSection('retirementPlanning', data)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
