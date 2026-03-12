'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { DetectedPlans } from '@/lib/benefits-import/types';

type WizardStep = 'upload' | 'detecting' | 'review' | 'extracting' | 'complete' | 'error';

interface Phase1Response {
  success: boolean;
  detectedPlans: DetectedPlans;
  chaptersList: string[];
  companyName: string;
  themeColor?: string;
  fileAssetId: string;
  logoAssetId?: string;
  clientSlug: string;
}

interface BenefitsImportWizardProps {
  clientSlug: string;
  onComplete?: () => void;
}

export function BenefitsImportWizard({ clientSlug, onComplete }: BenefitsImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [error, setError] = useState<string | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [phase1Data, setPhase1Data] = useState<Phase1Response | null>(null);
  const [editedPlans, setEditedPlans] = useState<DetectedPlans | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [themeColor, setThemeColor] = useState('#1e40af');
  const [chapters, setChapters] = useState<string[]>([]);

  const [phase2Result, setPhase2Result] = useState<{ message: string; chaptersCount: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const runPhase1 = async () => {
    if (!pdfFile) return;
    setStep('detecting');
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 1000);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('clientSlug', clientSlug);
      if (logoFile) formData.append('logo', logoFile);

      const res = await fetch('/api/benefits-import', { method: 'POST', body: formData });
      const json = await res.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Phase 1 detection failed');
      }

      const data = json as Phase1Response;
      setPhase1Data(data);
      setEditedPlans({ ...data.detectedPlans });
      setCompanyName(data.companyName || '');
      setThemeColor(data.themeColor || '#1e40af');
      setChapters(data.chaptersList || []);
      setStep('review');
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
      setStep('error');
    }
  };

  const runPhase2 = async () => {
    if (!phase1Data || !editedPlans) return;
    setStep('extracting');
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1.5, 90));
    }, 1000);

    try {
      const res = await fetch('/api/benefits-import/phase2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileAssetId: phase1Data.fileAssetId,
          clientSlug,
          logoAssetId: phase1Data.logoAssetId,
          confirmedPlans: editedPlans,
          companyName,
          themeColor,
          chaptersList: chapters,
        }),
      });

      const json = await res.json();
      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Phase 2 extraction failed');
      }

      setPhase2Result(json);
      setStep('complete');
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
      setStep('error');
    }
  };

  const reset = () => {
    setStep('upload');
    setError(null);
    setPdfFile(null);
    setLogoFile(null);
    setPhase1Data(null);
    setEditedPlans(null);
    setPhase2Result(null);
    setProgress(0);
  };

  const updatePlanList = (
    field: keyof DetectedPlans,
    index: number,
    value: string
  ) => {
    if (!editedPlans) return;
    const updated = [...editedPlans[field]];
    updated[index] = value;
    setEditedPlans({ ...editedPlans, [field]: updated });
  };

  const removePlanItem = (field: keyof DetectedPlans, index: number) => {
    if (!editedPlans) return;
    const updated = editedPlans[field].filter((_, i) => i !== index);
    setEditedPlans({ ...editedPlans, [field]: updated });
  };

  const addPlanItem = (field: keyof DetectedPlans) => {
    if (!editedPlans) return;
    setEditedPlans({ ...editedPlans, [field]: [...editedPlans[field], ''] });
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <StepDot active={step === 'upload'} done={['detecting', 'review', 'extracting', 'complete'].includes(step)} label="Upload" />
        <StepLine />
        <StepDot active={step === 'detecting'} done={['review', 'extracting', 'complete'].includes(step)} label="Detect" />
        <StepLine />
        <StepDot active={step === 'review'} done={['extracting', 'complete'].includes(step)} label="Review" />
        <StepLine />
        <StepDot active={step === 'extracting'} done={step === 'complete'} label="Extract" />
        <StepLine />
        <StepDot active={step === 'complete'} done={false} label="Done" />
      </div>

      {/* ── Step: Upload ── */}
      {step === 'upload' && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upload Benefits Guide</h3>
            <p className="text-sm text-slate-500 mt-1">
              Upload an employer benefits guide PDF. The AI extraction pipeline will detect plans and generate structured content automatically.
            </p>
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label>Benefits Guide PDF *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                pdfFile ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              {pdfFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{pdfFile.name}</p>
                    <p className="text-sm text-slate-500">{(pdfFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 text-slate-400 mx-auto" />
                  <p className="text-slate-600 font-medium">Click to upload or drag & drop</p>
                  <p className="text-sm text-slate-400">PDF files only</p>
                </div>
              )}
            </div>
          </div>

          {/* Logo Upload (optional) */}
          <div className="space-y-2">
            <Label>Company Logo (optional)</Label>
            <div className="flex items-center gap-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                {logoFile ? logoFile.name : 'Choose logo image'}
              </Button>
              {logoFile && (
                <Button variant="ghost" size="sm" onClick={() => setLogoFile(null)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>

          <Button onClick={runPhase1} disabled={!pdfFile} className="bg-blue-600 hover:bg-blue-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Start AI Extraction
          </Button>
        </Card>
      )}

      {/* ── Step: Detecting (Phase 1 progress) ── */}
      {step === 'detecting' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Analyzing PDF...</h3>
              <p className="text-sm text-slate-500">Detecting benefit plans and document structure. This may take a few minutes.</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-400 text-right">{Math.round(progress)}%</p>
        </Card>
      )}

      {/* ── Step: Review (Phase 1 results) ── */}
      {step === 'review' && editedPlans && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Plans Detected
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Review and edit the detected plans below. You can add, remove, or rename plans before extraction.
            </p>
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Theme Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-9 w-12 rounded border border-slate-300 cursor-pointer"
                />
                <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>

          {/* Plan Lists */}
          <div className="grid grid-cols-2 gap-6">
            <PlanListEditor
              label="Medical Plans"
              plans={editedPlans.medicalPlans}
              onChange={(i, v) => updatePlanList('medicalPlans', i, v)}
              onRemove={(i) => removePlanItem('medicalPlans', i)}
              onAdd={() => addPlanItem('medicalPlans')}
            />
            <PlanListEditor
              label="Dental Plans"
              plans={editedPlans.dentalPlans}
              onChange={(i, v) => updatePlanList('dentalPlans', i, v)}
              onRemove={(i) => removePlanItem('dentalPlans', i)}
              onAdd={() => addPlanItem('dentalPlans')}
            />
            <PlanListEditor
              label="Vision Plans"
              plans={editedPlans.visionPlans}
              onChange={(i, v) => updatePlanList('visionPlans', i, v)}
              onRemove={(i) => removePlanItem('visionPlans', i)}
              onAdd={() => addPlanItem('visionPlans')}
            />
            <PlanListEditor
              label="Premium Tiers"
              plans={editedPlans.premiumTiers}
              onChange={(i, v) => updatePlanList('premiumTiers', i, v)}
              onRemove={(i) => removePlanItem('premiumTiers', i)}
              onAdd={() => addPlanItem('premiumTiers')}
            />
          </div>

          {/* Detected Chapters - editable so you can add missed chapters */}
          <div className="space-y-2">
            <Label>Chapters to Extract</Label>
            <p className="text-xs text-slate-500 mb-1">
              Add, remove, or rename chapters. Phase 2 will extract content for each chapter listed here.
            </p>
            {chapters.length === 0 && (
              <p className="text-sm text-slate-400 italic">None detected — add chapters below</p>
            )}
            {chapters.map((ch, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={ch}
                  onChange={(e) => {
                    const next = [...chapters];
                    next[i] = e.target.value;
                    setChapters(next);
                  }}
                  placeholder="Chapter title"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChapters(chapters.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChapters([...chapters, ''])}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Chapter
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={reset}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            <Button onClick={runPhase2} className="bg-blue-600 hover:bg-blue-700">
              Confirm & Extract Content
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* ── Step: Extracting (Phase 2 progress) ── */}
      {step === 'extracting' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Extracting Content...</h3>
              <p className="text-sm text-slate-500">
                Running template-based extraction on the confirmed plans. This may take several minutes.
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-400 text-right">{Math.round(progress)}%</p>
        </Card>
      )}

      {/* ── Step: Complete ── */}
      {step === 'complete' && phase2Result && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Extraction Complete!</h3>
              <p className="text-sm text-slate-500">{phase2Result.message}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            <strong>{phase2Result.chaptersCount}</strong> benefit chapters extracted and saved.
            Content has been published and is now live on the site.
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={reset}>
              Import Another
            </Button>
            {onComplete && (
              <Button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700">
                Go to Content Editor
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ── Step: Error ── */}
      {step === 'error' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Extraction Failed</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setStep(phase1Data ? 'review' : 'upload')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {phase1Data ? 'Back to Review' : 'Try Again'}
          </Button>
        </Card>
      )}
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-3 w-3 rounded-full border-2 transition-colors ${
          done ? 'bg-green-500 border-green-500' :
          active ? 'bg-blue-600 border-blue-600' :
          'bg-white border-slate-300'
        }`}
      />
      <span className={`text-xs ${active ? 'text-blue-600 font-medium' : done ? 'text-green-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine() {
  return <div className="flex-1 h-px bg-slate-200 min-w-[20px]" />;
}

function PlanListEditor({
  label,
  plans,
  onChange,
  onRemove,
  onAdd,
}: {
  label: string;
  plans: string[];
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {plans.length === 0 && (
        <p className="text-sm text-slate-400 italic">None detected</p>
      )}
      {plans.map((plan, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={plan}
            onChange={(e) => onChange(i, e.target.value)}
            className="flex-1"
          />
          <Button variant="ghost" size="sm" onClick={() => onRemove(i)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-3 w-3 mr-1" /> Add
      </Button>
    </div>
  );
}
