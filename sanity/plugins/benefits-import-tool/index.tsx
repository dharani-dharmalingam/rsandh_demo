'use client'

/**
 * Studio tool: "Import Benefits Guide" – Multi-step wizard.
 * Step 1: Upload PDF + client slug + optional logo
 * Step 2: Review & edit detected plans/chapters + custom template builder
 * Step 3: Phase 2 extraction + seeding (progress)
 * Step 4: Done
 */

import { useState, useCallback, useEffect, type CSSProperties } from 'react'
import {
  Card,
  Stack,
  Box,
  Label,
  TextInput,
  Button,
  Spinner,
  Text,
  Flex,
  Grid,
} from '@sanity/ui'
import { useClient } from 'sanity'
import { runPhase1, runPhase2 } from './api'
import type { Phase1Response } from './api'
import type { DetectedPlans, CustomTemplateDefinition, CustomTemplateField } from '@/lib/benefits-import/types'

const KNOWN_CHAPTER_KEYWORDS: Record<string, string[]> = {
  'overview': ['overview', 'available plans', 'plan options', 'summary of benefits'],
  'eligibility': ['eligibility', 'enrollment', 'qualifying'],
  'medical': ['medical', 'health plan'],
  'dental': ['dental'],
  'vision': ['vision', 'eye care'],
  'eap': ['eap', 'employee assistance', 'mental health'],
  'fsa-hsa': ['fsa', 'hsa', 'flexible spending', 'health savings'],
  'survivor-benefits': ['survivor', 'life insurance', 'ad&d', 'accidental death'],
  'supplemental-health': ['supplemental', 'accident', 'critical illness', 'hospital indemnity'],
  'income-protection': ['income protection', 'disability', 'short-term', 'long-term'],
  'financial-wellbeing': ['financial', '401k', '401(k)', 'retirement savings', 'student loan'],
  'paid-time-off': ['paid time off', 'pto', 'vacation', 'holiday', 'sick leave'],
  'voluntary-benefits': ['voluntary', 'legal', 'identity theft', 'pet insurance'],
}

function matchChapterToTemplate(chapterName: string): string | null {
  const lower = chapterName.toLowerCase()
  for (const [templateId, keywords] of Object.entries(KNOWN_CHAPTER_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return templateId
  }
  return null
}

const CATEGORY_OPTIONS = [
  { value: 'eligibility', label: 'Eligibility' },
  { value: 'medical', label: 'Medical' },
  { value: 'dental', label: 'Dental' },
  { value: 'vision', label: 'Vision' },
  { value: 'fsa-hsa', label: 'FSA / HSA' },
  { value: 'eap', label: 'EAP' },
  { value: 'supplemental', label: 'Supplemental' },
  { value: 'disability', label: 'Disability' },
  { value: 'life-insurance', label: 'Life Insurance' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'pet-insurance', label: 'Pet Insurance' },
  { value: 'college-savings', label: 'College Savings' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'paid-time-off', label: 'Paid Time Off' },
  { value: 'voluntary-benefits', label: 'Voluntary Benefits' },
  { value: 'other', label: 'Other' },
]

type WizardStep = 'upload' | 'review' | 'extracting' | 'done'

export function BenefitsImportTool() {
  const client = useClient({ apiVersion: '2024-02-12' })

  // ── State ──
  const [clientSlug, setClientSlug] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [step, setStep] = useState<WizardStep>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const [fileAssetId, setFileAssetId] = useState('')
  const [logoAssetId, setLogoAssetId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [themeColor, setThemeColor] = useState('')
  const [chaptersList, setChaptersList] = useState<string[]>([])

  const [medicalPlans, setMedicalPlans] = useState<string[]>([])
  const [dentalPlans, setDentalPlans] = useState<string[]>([])
  const [visionPlans, setVisionPlans] = useState<string[]>([])
  const [premiumTiers, setPremiumTiers] = useState<string[]>([])

  const [successMessage, setSuccessMessage] = useState('')
  const [createdDocs, setCreatedDocs] = useState<string[]>([]) 

  // ── Custom Template State ──
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateDefinition[]>([])
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplateDefinition[]>([])
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState<CustomTemplateDefinition>({
    templateId: '', displayName: '', description: '', category: 'other', fields: [],
  })

  // Load saved custom templates from Sanity when entering review step
  useEffect(() => {
    if (step === 'review') {
      client.fetch<any[]>(
        `*[_type == "customChapterTemplate"]{ "templateId": templateId.current, displayName, description, category, fields }`
      ).then(docs => {
        const mapped: CustomTemplateDefinition[] = (docs || []).map(d => ({
          templateId: d.templateId || '',
          displayName: d.displayName || '',
          description: d.description || '',
          category: d.category || 'other',
          fields: (d.fields || []).map((f: any) => ({
            fieldName: f.fieldName || '',
            fieldType: f.fieldType || 'text',
            fieldDescription: f.fieldDescription || '',
            tableColumns: f.tableColumns,
          })),
        }))
        setSavedTemplates(mapped)
      }).catch(() => { /* non-fatal */ })
    }
  }, [step, client])

  const stepsMeta: { key: WizardStep; label: string; num: number }[] = [
    { key: 'upload', label: 'Upload', num: 1 },
    { key: 'review', label: 'Review Plans', num: 2 },
    { key: 'extracting', label: 'Extract', num: 3 },
    { key: 'done', label: 'Done', num: 4 },
  ]
  const stepOrder: WizardStep[] = ['upload', 'review', 'extracting', 'done']
  const currentIdx = stepOrder.indexOf(step)

  // ── Handlers ──
  const handleUpload = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !clientSlug.trim()) {
      setError('Please provide both a PDF file and a client slug.')
      return
    }
    setError('')
    setLoading(true)
    try {
      setStatusMessage('Uploading PDF to Sanity...')
      const fileAsset = await client.assets.upload('file', file, {
        filename: `${clientSlug.trim()}-benefits-guide.pdf`,
      })
      let logoId: string | undefined
      if (logo) {
        setStatusMessage('Uploading logo...')
        const logoAsset = await client.assets.upload('image', logo)
        logoId = logoAsset._id
      }
      setStatusMessage('Detecting plans (this may take a couple minutes)...')
      const result: Phase1Response = await runPhase1(clientSlug, fileAsset._id, logoId)
      if (!result.success) {
        setError(result.error || 'Phase 1 detection failed')
        setLoading(false)
        setStatusMessage('')
        return
      }
      setFileAssetId(result.fileAssetId || fileAsset._id)
      setLogoAssetId(result.logoAssetId || logoId || '')
      setCompanyName(result.companyName || '')
      setThemeColor(result.themeColor || '')
      setChaptersList(result.chaptersList || [])
      setMedicalPlans([...result.detectedPlans.medicalPlans])
      setDentalPlans([...result.detectedPlans.dentalPlans])
      setVisionPlans([...result.detectedPlans.visionPlans])
      setPremiumTiers([...result.detectedPlans.premiumTiers])
      setStep('review')
      setStatusMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
  }, [file, clientSlug, logo, client])

  const handleConfirm = useCallback(async () => {
    setError('')
    setLoading(true)
    setStep('extracting')
    setCreatedDocs([])

    try {
      const confirmedPlans: DetectedPlans = { medicalPlans, dentalPlans, visionPlans, premiumTiers }

      // Custom template IDs use `custom:` prefix so buildSchemaFromTemplates can identify them
      const customIds = customTemplates.map(t => `custom:${t.templateId}`)

      // Split extraction into batches; custom templates are included in the last batch
      const batches = [
        { id: 'Basic Info', ids: ['static-fields', 'overview', 'eligibility', 'eap'] },
        { id: 'Core Plans', ids: ['medical', 'dental', 'vision'] },
        { id: 'Health & Protection', ids: ['fsa-hsa', 'survivor-benefits', 'supplemental-health'] },
        { id: 'Financial & Time Off', ids: ['income-protection', 'financial-wellbeing', 'paid-time-off', 'voluntary-benefits', 'dynamic', ...customIds] }
      ]

      let combinedCreated: string[] = []
      let lastMessage = ''

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const batchHasCustom = batch.ids.some(id => id.startsWith('custom:'))
        const progress = `Batch ${i + 1}/${batches.length}: ${batch.id}...`
        setStatusMessage(progress)
        console.log(`[benefits-import] Starting ${progress}`)

        const result = await runPhase2(
          fileAssetId, clientSlug, confirmedPlans,
          logoAssetId || undefined, companyName, themeColor,
          '', chaptersList, batch.ids,
          batchHasCustom ? customTemplates : undefined
        )

        if (!result.success) {
          setError(`Failed at ${batch.id}: ${result.error || 'Unknown error'}`)
          setStep('review')
          setLoading(false)
          return
        }

        if (result.created) {
          combinedCreated = [...new Set([...combinedCreated, ...result.created])]
        }
        lastMessage = result.message || 'Progressing...'
      }

      setSuccessMessage('Site generated successfully with all segments!')
      setCreatedDocs(combinedCreated)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
      setStep('review')
    } finally {
      setLoading(false)
      setStatusMessage('')
    }
  }, [fileAssetId, clientSlug, logoAssetId, companyName, themeColor, medicalPlans, dentalPlans, visionPlans, premiumTiers, chaptersList, customTemplates])

  const handleReset = useCallback(() => {
    setStep('upload'); setFile(null); setLogo(null); setClientSlug(''); setError(''); setStatusMessage('')
    setCompanyName(''); setThemeColor(''); setChaptersList([])
    setMedicalPlans([]); setDentalPlans([]); setVisionPlans([]); setPremiumTiers([])
    setSuccessMessage(''); setCreatedDocs([])
    setCustomTemplates([]); setEditingChapter(null)
  }, [])

  // ── Custom template helpers ──
  const openTemplateBuilder = useCallback((chapterName: string) => {
    const slug = chapterName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase()
    setTemplateForm({
      templateId: slug,
      displayName: chapterName,
      description: `Extract all information from the "${chapterName}" chapter.`,
      category: 'other',
      fields: [],
    })
    setEditingChapter(chapterName)
  }, [])

  const addFieldToForm = useCallback(() => {
    setTemplateForm(prev => ({
      ...prev,
      fields: [...prev.fields, { fieldName: '', fieldType: 'text', fieldDescription: '' }],
    }))
  }, [])

  const updateField = useCallback((idx: number, patch: Partial<CustomTemplateField>) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === idx ? { ...f, ...patch } : f),
    }))
  }, [])

  const removeField = useCallback((idx: number) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }))
  }, [])

  const saveTemplate = useCallback(async () => {
    if (!templateForm.templateId || !templateForm.displayName || templateForm.fields.length === 0) {
      setError('Template needs an ID, name, and at least one field.')
      return
    }

    // Save to Sanity for persistence / reuse
    try {
      await client.createOrReplace({
        _type: 'customChapterTemplate',
        _id: `customTemplate-${templateForm.templateId}`,
        templateId: { _type: 'slug', current: templateForm.templateId },
        displayName: templateForm.displayName,
        description: templateForm.description,
        category: templateForm.category,
        fields: templateForm.fields.map(f => ({
          _type: 'object',
          _key: f.fieldName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          fieldName: f.fieldName,
          fieldType: f.fieldType,
          fieldDescription: f.fieldDescription,
          tableColumns: f.fieldType === 'table' ? f.tableColumns : undefined,
        })),
      })
    } catch {
      // Non-fatal: template can still be used in this session
      console.warn('[benefits-import] Could not persist template to Sanity, using for this session only.')
    }

    // Add to in-session custom templates (replace if exists)
    setCustomTemplates(prev => {
      const filtered = prev.filter(t => t.templateId !== templateForm.templateId)
      return [...filtered, { ...templateForm }]
    })
    setEditingChapter(null)
    setError('')
  }, [templateForm, client])

  const assignSavedTemplate = useCallback((chapterName: string, templateId: string) => {
    const saved = savedTemplates.find(t => t.templateId === templateId)
    if (saved && !customTemplates.some(t => t.templateId === saved.templateId)) {
      setCustomTemplates(prev => [...prev, saved])
    }
  }, [savedTemplates, customTemplates])

  const removeCustomTemplate = useCallback((templateId: string) => {
    setCustomTemplates(prev => prev.filter(t => t.templateId !== templateId))
  }, [])

  return (
    <div style={S.page}>
      {/* ── Hero Header ── */}
      <div style={S.hero}>
        <div style={S.heroIcon}>📋</div>
        <div style={S.heroTitle}>Import Benefits Guide</div>
        <div style={S.heroSub}>
          Upload a benefits guide PDF to auto-generate client site content in Sanity
        </div>
      </div>

      {/* ── Step Progress ── */}
      <div style={S.stepBar}>
        {stepsMeta.map((s, i) => {
          const isActive = s.key === step
          const isPast = i < currentIdx
          return (
            <div key={s.key} style={S.stepOuter}>
              {/* connector line */}
              {i > 0 && (
                <div style={{
                  ...S.stepLine,
                  background: isPast ? '#38a169' : 'var(--card-border-color, #ddd)',
                }} />
              )}
              {/* circle */}
              <div style={{
                ...S.stepCircle,
                background: isActive ? '#4f46e5' : isPast ? '#38a169' : 'var(--card-bg2-color, #eee)',
                color: isActive || isPast ? '#fff' : 'var(--card-muted-fg-color, #888)',
                boxShadow: isActive ? '0 0 0 4px rgba(79,70,229,0.2)' : 'none',
              }}>
                {isPast ? '✓' : s.num}
              </div>
              {/* label */}
              <div style={{
                ...S.stepLabel,
                color: isActive ? '#4f46e5' : isPast ? '#38a169' : 'var(--card-muted-fg-color, #888)',
                fontWeight: isActive ? 700 : 500,
              }}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <Card padding={3} tone="critical" radius={2} style={{ marginBottom: 24 }}>
          <Flex align="center" gap={2}>
            <span>⚠️</span>
            <Text size={1}>{error}</Text>
          </Flex>
        </Card>
      )}

      {/* ══════════ STEP 1: Upload ══════════ */}
      {step === 'upload' && (
        <form onSubmit={handleUpload}>
          <Stack space={5}>
            {/* Client Slug */}
            <div style={S.section}>
              <div style={S.sectionHeader}>
                <span style={S.sectionIcon}>🏢</span>
                <div>
                  <div style={S.sectionTitle}>Client Slug</div>
                  <div style={S.sectionDesc}>A URL-safe identifier for this client</div>
                </div>
              </div>
              <TextInput
                value={clientSlug}
                onChange={(e) => setClientSlug(e.currentTarget.value)}
                placeholder="e.g. premier-america"
                disabled={loading}
                fontSize={2}
              />
            </div>

            {/* PDF Upload */}
            <div style={S.section}>
              <div style={S.sectionHeader}>
                <span style={S.sectionIcon}>📄</span>
                <div>
                  <div style={S.sectionTitle}>Benefits Guide PDF</div>
                  <div style={S.sectionDesc}>Upload the employee benefits guide document</div>
                </div>
              </div>
              <label style={{
                ...S.dropZone,
                borderColor: file ? '#38a169' : undefined,
                background: file ? 'rgba(56,161,105,0.04)' : undefined,
              }}>
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <span style={{ fontSize: 24, color: '#38a169' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📁</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Click to browse or drag & drop</div>
                    <div style={{ fontSize: 12, color: '#999' }}>PDF files only</div>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={loading}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Logo Upload */}
            <div style={S.section}>
              <div style={S.sectionHeader}>
                <span style={S.sectionIcon}>🖼️</span>
                <div>
                  <div style={S.sectionTitle}>Company Logo <span style={{ fontWeight: 400, fontSize: 12, color: '#999' }}>(optional)</span></div>
                  <div style={S.sectionDesc}>PNG, JPG, SVG, or WebP — displayed in the site header</div>
                </div>
              </div>
              <label style={{
                ...S.dropZone,
                padding: '20px 16px',
                borderColor: logo ? '#38a169' : undefined,
                background: logo ? 'rgba(56,161,105,0.04)' : undefined,
              }}>
                {logo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <span style={{ fontSize: 24, color: '#38a169' }}>✅</span>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{logo.name}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#999' }}>Click to select an image</div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                  disabled={loading}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={loading || !file || !clientSlug.trim()}
                style={{
                  ...S.primaryBtn,
                  opacity: (loading || !file || !clientSlug.trim()) ? 0.5 : 1,
                  cursor: (loading || !file || !clientSlug.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Detecting Plans...' : '🚀 Detect Plans'}
              </button>
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spinner />
                  <Text size={1} muted>{statusMessage}</Text>
                </div>
              )}
            </div>
          </Stack>
        </form>
      )}

      {/* ══════════ STEP 2: Review ══════════ */}
      {step === 'review' && (
        <Stack space={5}>
          {/* Info banner */}
          <div style={S.infoBanner}>
            <span style={{ fontSize: 20 }}>🔍</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Phase 1 Complete — Verify Results</div>
              <div style={{ color: '#666', fontSize: 13 }}>
                Review the detected plans below. Add any that were missed or remove incorrect ones before proceeding to extraction.
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div style={S.section}>
            <div style={S.sectionHeader}>
              <span style={S.sectionIcon}>🏢</span>
              <div style={S.sectionTitle}>Company Info</div>
            </div>
            <Grid columns={2} gap={4}>
              <Box>
                <Label size={0} style={{ marginBottom: 8, display: 'block' }}>Company Name</Label>
                <TextInput value={companyName} onChange={(e) => setCompanyName(e.currentTarget.value)} fontSize={1} />
              </Box>
              <Box>
                <Label size={0} style={{ marginBottom: 8, display: 'block' }}>Theme Color</Label>
                <Flex gap={2} align="center">
                  <Box flex={1}>
                    <TextInput value={themeColor} onChange={(e) => setThemeColor(e.currentTarget.value)} placeholder="#D31145" fontSize={1} />
                  </Box>
                  {themeColor && (
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: themeColor,
                      border: '2px solid var(--card-border-color)', flexShrink: 0,
                    }} />
                  )}
                </Flex>
              </Box>
            </Grid>
          </div>

          {/* Plan sections */}
          <PlanSection emoji="💊" label="Medical Plans" items={medicalPlans} onChange={setMedicalPlans} color="#e53e3e" placeholder="Add a medical plan name..." />
          <PlanSection emoji="🦷" label="Dental Plans" items={dentalPlans} onChange={setDentalPlans} color="#3182ce" placeholder="Add a dental plan name..." />
          <PlanSection emoji="👁️" label="Vision Plans" items={visionPlans} onChange={setVisionPlans} color="#805ad5" placeholder="Add a vision plan name..." />
          <PlanSection emoji="💰" label="Premium Tiers" items={premiumTiers} onChange={setPremiumTiers} color="#d69e2e" placeholder="Add a tier name..." />

          {/* Detected Chapters */}
          <PlanSection emoji="📚" label="Detected Chapters" items={chaptersList} onChange={setChaptersList} color="#38a169" placeholder="Add a chapter name..." />

          {/* ── Chapter Template Matching ── */}
          <div style={S.section}>
            <div style={S.sectionHeader}>
              <span style={S.sectionIcon}>🧩</span>
              <div style={S.sectionTitle}>Chapter Template Matching</div>
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              Chapters matched to a built-in template will use structured extraction. Unmatched chapters
              use generic extraction — or you can create a custom template for more precise results.
            </div>

            {chaptersList.length === 0 ? (
              <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic' }}>No chapters detected yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chaptersList.map(ch => {
                  const matched = matchChapterToTemplate(ch)
                  const hasCustom = customTemplates.some(t => {
                    const slug = ch.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase()
                    return t.templateId === slug
                  })
                  return (
                    <div key={ch} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--card-border-color, #e2e2e2)',
                      background: matched || hasCustom ? 'rgba(56,161,105,0.04)' : 'rgba(214,158,46,0.04)',
                    }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{ch}</span>
                      {matched ? (
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: 'rgba(56,161,105,0.12)', color: '#38a169',
                        }}>
                          ✓ {matched}
                        </span>
                      ) : hasCustom ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: 'rgba(79,70,229,0.12)', color: '#4f46e5',
                        }}>
                          ✓ Custom Template
                          <button type="button" onClick={() => {
                            const slug = ch.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase()
                            removeCustomTemplate(slug)
                          }} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#4f46e5', fontSize: 12, padding: 0, opacity: 0.7,
                          }}>✕</button>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                            background: 'rgba(214,158,46,0.12)', color: '#d69e2e',
                          }}>
                            Dynamic
                          </span>
                          <button type="button" onClick={() => openTemplateBuilder(ch)} style={{
                            ...S.smallBtn,
                            background: 'rgba(79,70,229,0.08)',
                            color: '#4f46e5',
                          }}>
                            + Template
                          </button>
                          {savedTemplates.length > 0 && (
                            <select
                              style={{ ...S.smallSelect }}
                              defaultValue=""
                              onChange={(e) => { if (e.target.value) assignSavedTemplate(ch, e.target.value) }}
                            >
                              <option value="" disabled>Assign saved...</option>
                              {savedTemplates.map(st => (
                                <option key={st.templateId} value={st.templateId}>{st.displayName}</option>
                              ))}
                            </select>
                          )}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Template Builder (inline) ── */}
          {editingChapter && (
            <div style={{ ...S.section, borderColor: '#4f46e5', borderWidth: 2 }}>
              <div style={S.sectionHeader}>
                <span style={S.sectionIcon}>🔧</span>
                <div>
                  <div style={S.sectionTitle}>Create Template: {editingChapter}</div>
                  <div style={S.sectionDesc}>Define extraction fields for this chapter type</div>
                </div>
              </div>

              <Stack space={4}>
                {/* Template ID + Display Name */}
                <Grid columns={2} gap={3}>
                  <Box>
                    <Label size={0} style={{ marginBottom: 6, display: 'block' }}>Template ID</Label>
                    <TextInput
                      value={templateForm.templateId}
                      onChange={(e) => setTemplateForm(p => ({ ...p, templateId: e.currentTarget.value }))}
                      fontSize={1}
                    />
                  </Box>
                  <Box>
                    <Label size={0} style={{ marginBottom: 6, display: 'block' }}>Display Name</Label>
                    <TextInput
                      value={templateForm.displayName}
                      onChange={(e) => setTemplateForm(p => ({ ...p, displayName: e.currentTarget.value }))}
                      fontSize={1}
                    />
                  </Box>
                </Grid>

                {/* Category */}
                <Box>
                  <Label size={0} style={{ marginBottom: 6, display: 'block' }}>Category</Label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(p => ({ ...p, category: e.target.value }))}
                    style={S.formSelect}
                  >
                    {CATEGORY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Box>

                {/* Description */}
                <Box>
                  <Label size={0} style={{ marginBottom: 6, display: 'block' }}>LLM Description</Label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    style={S.textarea}
                    placeholder="Describe what the LLM should extract from this chapter..."
                  />
                </Box>

                {/* Fields */}
                <Box>
                  <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
                    <Label size={0}>Extraction Fields ({templateForm.fields.length})</Label>
                    <button type="button" onClick={addFieldToForm} style={{
                      ...S.smallBtn, background: 'rgba(56,161,105,0.08)', color: '#38a169',
                    }}>
                      + Add Field
                    </button>
                  </Flex>

                  {templateForm.fields.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                      No fields yet. Click &quot;+ Add Field&quot; to define extraction fields.
                    </div>
                  ) : (
                    <Stack space={3}>
                      {templateForm.fields.map((field, fi) => (
                        <div key={fi} style={{
                          padding: '12px 14px', borderRadius: 8,
                          border: '1px solid var(--card-border-color, #e2e2e2)',
                          background: 'var(--card-bg2-color, #fafafa)',
                        }}>
                          <Flex gap={2} align="flex-end" wrap="wrap">
                            <Box style={{ flex: '1 1 140px', minWidth: 120 }}>
                              <Label size={0} style={{ marginBottom: 4, display: 'block' }}>Field Name</Label>
                              <TextInput
                                value={field.fieldName}
                                onChange={(e) => updateField(fi, { fieldName: e.currentTarget.value })}
                                placeholder="e.g. coverage_details"
                                fontSize={1}
                              />
                            </Box>
                            <Box style={{ flex: '0 0 130px' }}>
                              <Label size={0} style={{ marginBottom: 4, display: 'block' }}>Type</Label>
                              <select
                                value={field.fieldType}
                                onChange={(e) => updateField(fi, { fieldType: e.target.value as CustomTemplateField['fieldType'] })}
                                style={S.formSelect}
                              >
                                <option value="text">Text</option>
                                <option value="paragraphs">Bullet List</option>
                                <option value="table">Table</option>
                              </select>
                            </Box>
                            <Box style={{ flex: '2 1 200px', minWidth: 160 }}>
                              <Label size={0} style={{ marginBottom: 4, display: 'block' }}>Description (LLM prompt)</Label>
                              <TextInput
                                value={field.fieldDescription}
                                onChange={(e) => updateField(fi, { fieldDescription: e.currentTarget.value })}
                                placeholder="What to extract..."
                                fontSize={1}
                              />
                            </Box>
                            <button type="button" onClick={() => removeField(fi)} title="Remove field" style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#e53e3e', fontSize: 16, padding: '4px 6px', alignSelf: 'flex-end',
                            }}>✕</button>
                          </Flex>

                          {field.fieldType === 'table' && (
                            <Box style={{ marginTop: 8 }}>
                              <Label size={0} style={{ marginBottom: 4, display: 'block' }}>Table Columns (comma-separated)</Label>
                              <TextInput
                                value={(field.tableColumns || []).join(', ')}
                                onChange={(e) => {
                                  const cols = e.currentTarget.value.split(',').map(c => c.trim()).filter(Boolean)
                                  updateField(fi, { tableColumns: cols })
                                }}
                                placeholder="e.g. Benefit, In-Network, Out-of-Network"
                                fontSize={1}
                              />
                            </Box>
                          )}
                        </div>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* Actions */}
                <Flex gap={2} justify="flex-end">
                  <Button text="Cancel" mode="ghost" fontSize={1} padding={3} onClick={() => setEditingChapter(null)} />
                  <button type="button" onClick={saveTemplate} style={{
                    ...S.primaryBtn, padding: '10px 20px', fontSize: 13,
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    opacity: templateForm.fields.length === 0 ? 0.5 : 1,
                    cursor: templateForm.fields.length === 0 ? 'not-allowed' : 'pointer',
                  }}>
                    Save Template
                  </button>
                </Flex>
              </Stack>
            </div>
          )}

          {/* Custom templates summary */}
          {customTemplates.length > 0 && !editingChapter && (
            <div style={{ ...S.section, background: 'rgba(79,70,229,0.02)' }}>
              <div style={S.sectionHeader}>
                <span style={S.sectionIcon}>📦</span>
                <div style={S.sectionTitle}>Custom Templates ({customTemplates.length})</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {customTemplates.map(t => (
                  <span key={t.templateId} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', color: '#4f46e5',
                  }}>
                    {t.displayName} ({t.fields.length} fields)
                    <button type="button" onClick={() => removeCustomTemplate(t.templateId)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#4f46e5', fontSize: 14, padding: '0 2px', opacity: 0.7,
                    }}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 4 }}>
            <Button text="← Back" mode="ghost" onClick={() => setStep('upload')} fontSize={1} padding={3} />
            <button type="button" onClick={handleConfirm} disabled={loading} style={{
              ...S.primaryBtn,
              background: 'linear-gradient(135deg, #38a169, #2f855a)',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              ✅ Confirm & Extract
            </button>
          </div>
        </Stack>
      )}

      {/* ══════════ STEP 3: Extracting ══════════ */}
      {step === 'extracting' && (
        <div style={S.centerCard}>
          <div style={{ marginBottom: 24 }}>
            <Spinner style={{ width: 40, height: 40 }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Extracting Benefits Data</div>
          <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
            {statusMessage || 'Initializing...'}
          </div>
          <div style={{ color: '#666', fontSize: 14, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Phase 2 is running in batches to ensure maximum accuracy and prevent timeouts.
            This typically takes 2–4 minutes.
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: '#999', fontStyle: 'italic' }}>
            Please do not close this tab.
          </div>
        </div>
      )}

      {/* ══════════ STEP 4: Done ══════════ */}
      {step === 'done' && (
        <Stack space={4}>
          <div style={S.centerCard}>
            <div style={S.successCircle}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Import Complete!</div>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>{successMessage}</div>
            {createdDocs.length > 0 && (
              <div style={{
                background: 'rgba(56,161,105,0.08)', border: '1px solid rgba(56,161,105,0.2)',
                borderRadius: 8, padding: '10px 20px', display: 'inline-block', marginBottom: 20,
              }}>
                <span style={{ fontWeight: 600 }}>{createdDocs.length}</span> documents created
              </div>
            )}

            {clientSlug && (
              <div style={{ marginTop: 4 }}>
                <a
                  href={`${typeof window !== 'undefined' ? window.location.origin.replace(/\/sanity.*$/, '') : ''}/${clientSlug.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={S.siteLink}
                >
                  🔗 View Client Site: /{clientSlug.trim()}
                </a>
              </div>
            )}
          </div>
          <Flex justify="center">
            <Button text="Import Another Guide" mode="ghost" tone="primary" fontSize={1} padding={3} onClick={handleReset} />
          </Flex>
        </Stack>
      )}
    </div>
  )
}

// ── Sub-component: Plan Section ──

function PlanSection({
  emoji, label, items, onChange, color, placeholder,
}: {
  emoji: string; label: string; items: string[]; onChange: (v: string[]) => void; color: string; placeholder: string
}) {
  const [newItem, setNewItem] = useState('')
  const addItem = () => {
    const t = newItem.trim()
    if (t && !items.includes(t)) { onChange([...items, t]); setNewItem('') }
  }
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div style={S.section}>
      <div style={S.sectionHeader}>
        <span style={S.sectionIcon}>{emoji}</span>
        <div style={S.sectionTitle}>{label}</div>
        <span style={{
          background: items.length > 0 ? color : '#ccc',
          color: '#fff', borderRadius: 12, padding: '2px 10px',
          fontSize: 12, fontWeight: 700, marginLeft: 8,
        }}>
          {items.length}
        </span>
      </div>

      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {items.map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: `${color}10`, border: `1px solid ${color}30`, color: color,
            }}>
              {item}
              <button type="button" onClick={() => removeItem(i)} title="Remove" style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                color: color, padding: '0 2px', lineHeight: 1, opacity: 0.7,
              }}>✕</button>
            </span>
          ))}
        </div>
      )}

      <Flex gap={2} align="center">
        <Box flex={1}>
          <TextInput
            value={newItem}
            onChange={(e) => setNewItem(e.currentTarget.value)}
            placeholder={placeholder}
            fontSize={1}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
          />
        </Box>
        <Button text="+ Add" mode="ghost" tone="positive" fontSize={1} padding={3} onClick={addItem} disabled={!newItem.trim()} />
      </Flex>
    </div>
  )
}

// ── Styles ──

const S: Record<string, CSSProperties> = {
  page: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '32px 24px 64px',
  },

  // Hero header
  hero: {
    textAlign: 'center',
    marginBottom: 32,
    padding: '32px 24px',
    background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(56,161,105,0.06))',
    borderRadius: 16,
    border: '1px solid rgba(79,70,229,0.1)',
  },
  heroIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: '#777',
    maxWidth: 400,
    margin: '0 auto',
    lineHeight: 1.5,
  },

  // Step bar
  stepBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 0,
    marginBottom: 32,
    padding: '0 20px',
  },
  stepOuter: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    position: 'relative' as const,
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    transition: 'all 0.3s ease',
    zIndex: 1,
  },
  stepLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center' as const,
    transition: 'all 0.2s ease',
  },
  stepLine: {
    position: 'absolute' as const,
    top: 18,
    right: '50%',
    width: '100%',
    height: 3,
    zIndex: 0,
    transition: 'background 0.3s ease',
  },

  // Section card
  section: {
    background: 'var(--card-bg-color, #fff)',
    border: '1px solid var(--card-border-color, #e2e2e2)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 22,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  // File drop zone
  dropZone: {
    display: 'block',
    border: '2px dashed var(--card-border-color, #d0d0d0)',
    borderRadius: 10,
    padding: '28px 16px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
  },

  // Primary button
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 28px',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
    transition: 'all 0.2s ease',
  },

  // Info banner
  infoBanner: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    padding: '16px 20px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(49,130,206,0.06), rgba(79,70,229,0.06))',
    border: '1px solid rgba(49,130,206,0.15)',
  },

  // Chapter badge
  chapterBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: 'var(--card-bg2-color, #f0f0f4)',
    border: '1px solid var(--card-border-color)',
  },

  // Center card (extracting/done)
  centerCard: {
    textAlign: 'center' as const,
    padding: '56px 32px',
    borderRadius: 16,
    border: '1px solid var(--card-border-color)',
    background: 'var(--card-bg-color)',
  },

  // Success circle
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #38a169, #2f855a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: 30,
    fontWeight: 700,
    color: '#fff',
    boxShadow: '0 4px 16px rgba(56,161,105,0.3)',
  },

  // Client site link on Done step
  siteLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 28px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },

  // Small inline button
  smallBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    border: 'none',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Small inline select
  smallSelect: {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid var(--card-border-color, #ccc)',
    fontSize: 11,
    background: 'var(--card-bg-color, #fff)',
    cursor: 'pointer',
  },

  // Form select (full width)
  formSelect: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid var(--card-border-color, #ccc)',
    fontSize: 13,
    background: 'var(--card-bg-color, #fff)',
  },

  // Textarea
  textarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid var(--card-border-color, #ccc)',
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    background: 'var(--card-bg-color, #fff)',
  },
}
