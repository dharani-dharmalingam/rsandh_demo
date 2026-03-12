'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Globe, Loader2, CheckCircle2, Upload, Building2, Users, ArrowRight } from 'lucide-react';
import { SiteSettingsEditor } from '@/components/admin/site-settings-editor';
import { BenefitsEditor } from '@/components/admin/benefits-editor';
import { OpenEnrollmentEditor } from '@/components/admin/open-enrollment-editor';
import { BenefitChangesEditor } from '@/components/admin/benefit-changes-editor';
import { EnrollmentChecklistEditor } from '@/components/admin/enrollment-checklist-editor';
import { RetirementPlanningEditor } from '@/components/admin/retirement-planning-editor';
import { BenefitsImportWizard } from '@/components/admin/benefits-import-wizard';
import type { EmployerContent } from '@/lib/content/types';

type EmployerItem = { slug: string; name: string };

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [content, setContent] = useState<EmployerContent | null>(null);
  const [employerSlug, setEmployerSlug] = useState<string | null>(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [employers, setEmployers] = useState<EmployerItem[]>([]);
  const [newImportSlug, setNewImportSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('clients');

  const loadContent = useCallback(async () => {
    const employerParam = searchParams.get('employer');
    try {
      setLoading(true);
      setError(null);

      // No employer in URL → global admin: list clients + import for new
      if (!employerParam) {
        setIsGlobalView(true);
        setContent(null);
        setEmployerSlug(null);
        const listRes = await fetch('/api/content/list');
        const listJson = await listRes.json();
        if (listRes.ok && Array.isArray(listJson.employers)) {
          setEmployers(listJson.employers);
        } else {
          setEmployers([]);
        }
        setLoading(false);
        return;
      }

      setIsGlobalView(false);
      const res = await fetch(`/api/content?mode=draft&employer=${encodeURIComponent(employerParam)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setContent(json.data ?? null);
      setHasDraft(json.hasDraft ?? false);
      setEmployerSlug(json.slug ?? employerParam ?? null);
    } catch (err: any) {
      setError(err.message);
      setEmployerSlug(employerParam ?? null);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

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

  const slug = content?.client?.slug ?? employerSlug ?? searchParams.get('employer') ?? 'unknown';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading...</span>
      </div>
    );
  }

  // Global admin: Clients list + Import for new client
  if (isGlobalView) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <h1 className="text-lg font-bold text-slate-900">Benefits Admin</h1>
            <p className="text-sm text-slate-500">Manage clients or start a new extraction</p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="clients" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-4">
              <p className="text-slate-600">Select a client to edit content or view their portal.</p>
              {employers.length === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                  No clients yet. Use the <strong>Import</strong> tab to create one from a PDF.
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {employers.map((emp) => (
                    <Card key={emp.slug} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.slug}</p>
                        </div>
                        <Link href={`/admin?employer=${encodeURIComponent(emp.slug)}`}>
                          <Button size="sm" variant="outline" className="shrink-0">
                            Open <ArrowRight className="h-3 w-3 ml-1 inline" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <p className="text-slate-600">Create a new client by uploading a benefits guide PDF. Enter a unique client slug (e.g. <code className="text-xs bg-slate-100 px-1 rounded">acme-corp</code>) first.</p>
              <div className="max-w-sm space-y-2">
                <Label>New client slug</Label>
                <Input
                  value={newImportSlug}
                  onChange={(e) => setNewImportSlug(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
                  placeholder="e.g. acme-corp"
                />
              </div>
              {newImportSlug.trim() ? (
                <BenefitsImportWizard
                  clientSlug={newImportSlug.trim()}
                  onComplete={() => {
                    setEmployers((prev) => {
                      const next = [...prev];
                      if (!next.some((e) => e.slug === newImportSlug.trim())) {
                        next.push({ slug: newImportSlug.trim(), name: newImportSlug.trim() });
                      }
                      return next;
                    });
                    router.push(`/admin?employer=${encodeURIComponent(newImportSlug.trim())}`);
                  }}
                />
              ) : (
                <Card className="p-8 text-center text-slate-500">
                  Enter a client slug above to start the import wizard.
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-2">{error}</p>
          <p className="text-sm text-slate-500 mb-4">
            Open admin with an employer, e.g. /admin?employer=rs-h&token=admin123
          </p>
          <Button onClick={loadContent}>Retry</Button>
        </Card>
      </div>
    );
  }

  // Client context but no content yet: show Import tab only
  if (!content) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 inline-block mb-1">
              ← All clients
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Benefits Admin</h1>
            <p className="text-sm text-slate-500">
              No content for <strong>{slug}</strong> — upload a PDF to create it
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <BenefitsImportWizard
            clientSlug={slug}
            onComplete={() => {
              loadContent();
              setActiveTab('benefits');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 shrink-0">
              ← All clients
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Benefits Admin</h1>
              <p className="text-sm text-slate-500">
                {content.siteSettings?.clientName || 'Unknown'} &mdash;{' '}
                {hasDraft ? (
                  <span className="text-amber-600 font-medium">Unsaved draft</span>
                ) : (
                  <span className="text-green-600 font-medium">Published</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {status}
              </span>
            )}
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={publishing} className="bg-blue-600 hover:bg-blue-700">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          </div>
        </div>
      </div>

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
              clientSlug={slug}
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
