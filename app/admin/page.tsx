'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Globe, Loader2, CheckCircle2, Upload, Building2, Users, ArrowRight, Settings, Shield, CalendarDays, TrendingUp, ClipboardList, PiggyBank, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteSettingsEditor } from '@/components/admin/site-settings-editor';
import { BenefitsEditor } from '@/components/admin/benefits-editor';
import { OpenEnrollmentEditor } from '@/components/admin/open-enrollment-editor';
import { BenefitChangesEditor } from '@/components/admin/benefit-changes-editor';
import { EnrollmentChecklistEditor } from '@/components/admin/enrollment-checklist-editor';
import { RetirementPlanningEditor } from '@/components/admin/retirement-planning-editor';
import { BenefitsImportWizard } from '@/components/admin/benefits-import-wizard';
import type { EmployerContent } from '@/lib/content/types';

type EmployerItem = { slug: string; name: string };

function AdminPageContent() {
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

  const navItems = [
    { id: 'import',     label: 'Import PDF',      icon: Upload },
    { id: 'settings',   label: 'Site Settings',   icon: Settings },
    { id: 'benefits',   label: 'Benefits',         icon: Shield },
    { id: 'enrollment', label: 'Open Enrollment',  icon: CalendarDays },
    { id: 'changes',    label: 'Benefit Changes',  icon: TrendingUp },
    { id: 'checklist',  label: 'Checklist',        icon: ClipboardList },
    { id: 'retirement', label: 'Retirement',       icon: PiggyBank },
  ];

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
      const res = await fetch('/api/content?action=publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try {
          const j = JSON.parse(text);
          if (j.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      setHasDraft(false);
      const json = await res.json().catch(() => ({}));
      setStatus(json.message || 'Published successfully');
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
      <div className="h-full overflow-y-auto">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-11 w-52 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Global admin: Clients list + Import for new client
  if (isGlobalView) {
    return (
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-800">Benefits Admin</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Manage clients and content</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="h-11 bg-white/90 border border-blue-100 p-1 rounded-xl shadow-sm">
              <TabsTrigger
                value="clients"
                className="group flex items-center gap-2 px-5 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-medium text-sm transition-all duration-200 hover:bg-blue-50 data-[state=inactive]:text-slate-600"
              >
                <Users className="h-4 w-4" />
                Clients
                {employers.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white">
                    {employers.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="flex items-center gap-2 px-5 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-medium text-sm transition-all duration-200 hover:bg-blue-50 data-[state=inactive]:text-slate-600"
              >
                <Upload className="h-4 w-4" />
                New Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-6 mt-0">
              <div className="opacity-0 animate-fade-in" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
                <h2 className="text-base font-semibold text-slate-800">Client Portals</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Select a client to edit content or manage their benefits portal.
                </p>
              </div>
              {employers.length === 0 ? (
                <Card className="border-slate-200 bg-white p-12 text-center rounded-xl shadow-sm opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                    <Building2 className="h-7 w-7 text-blue-500" />
                  </div>
                  <p className="text-slate-700 font-semibold">No clients yet</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    Use the <strong>New Import</strong> tab to create your first client by uploading a benefits guide PDF.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => setActiveTab('import')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {employers.map((emp, index) => (
                    <Card
                      key={emp.slug}
                      className="group relative border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 opacity-0 animate-fade-up"
                      style={{ animationDelay: `${120 + index * 60}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />
                      <Link href={`/admin?employer=${encodeURIComponent(emp.slug)}`} className="block pl-5 pr-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold text-sm group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800 truncate group-hover:text-blue-700 transition-colors">{emp.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">{emp.slug}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Globe className="h-3 w-3" />
                            Benefits Portal
                          </span>
                          <span className="text-xs text-blue-600 font-medium group-hover:underline">Edit content</span>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-6 mt-0">
              <div className="opacity-0 animate-fade-in" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
                <h2 className="text-base font-semibold text-slate-800">Create New Client</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter a unique client identifier (slug), then upload a benefits guide PDF to run AI extraction.
                </p>
              </div>
              <Card className="border-blue-100/80 bg-white/90 p-6 rounded-2xl shadow-md opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <div className="max-w-md space-y-2">
                  <Label htmlFor="import-slug" className="text-sm font-medium text-slate-700">
                    Client slug
                  </Label>
                  <Input
                    id="import-slug"
                    value={newImportSlug}
                    onChange={(e) => setNewImportSlug(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
                    placeholder="e.g. acme-corp"
                    className="h-10"
                  />
                  <p className="text-xs text-slate-500">
                    URL-safe identifier used in paths (lowercase, hyphens only)
                  </p>
                </div>
              </Card>
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
                <Card className="border-blue-100/80 bg-white/90 p-12 text-center rounded-2xl shadow-md">
                  <p className="text-slate-600">Enter a client slug above to start the import wizard.</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="border-red-200 bg-white/90 p-8 max-w-md rounded-2xl shadow-md animate-fade-in">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <p className="text-xs text-slate-500 mb-6">
            Open admin with an employer, e.g. /admin?employer=rs-h
          </p>
          <Button onClick={loadContent} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">Retry</Button>
        </Card>
      </div>
    );
  }

  // Client context but no content yet: show Import tab only
  if (!content) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <header className="shrink-0 border-b border-blue-100 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center gap-4">
              <Link
                href="/admin"
                className="text-sm text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                ← All clients
              </Link>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">Benefits Admin</h1>
                  <p className="text-xs text-slate-500">
                    No content for <strong>{slug}</strong> — upload a PDF to create it
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <BenefitsImportWizard
            clientSlug={slug}
            onComplete={() => {
              loadContent();
              setActiveTab('benefits');
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Client identity */}
        <div className="p-4 border-b border-slate-100">
          <Link
            href="/admin"
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors mb-3"
          >
            ← All clients
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {content.siteSettings?.clientName || slug}
              </p>
              <Badge
                variant="outline"
                className={hasDraft
                  ? 'text-amber-600 border-amber-200 bg-amber-50 text-[10px] px-1.5 py-0 h-4'
                  : 'text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px] px-1.5 py-0 h-4'}
              >
                {hasDraft ? 'Draft' : 'Published'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Save / Publish */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {status && (
            <p className="text-xs text-emerald-600 flex items-center gap-1.5 pb-1 animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {status}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-500 pb-1 truncate" title={error}>{error}</p>
          )}
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Draft
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Globe className="h-4 w-4 mr-1.5" />}
            Publish
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/80">
        {/* Topbar breadcrumb */}
        <header className="h-14 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-sm flex items-center px-6 gap-2">
          <span className="text-sm text-slate-400">Benefits Admin</span>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-sm font-medium text-slate-700">
            {navItems.find((n) => n.id === activeTab)?.label ?? activeTab}
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-sm text-slate-600">Loading admin...</span>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
