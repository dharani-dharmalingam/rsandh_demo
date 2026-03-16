'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldInput } from './field-input';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ChapterTablesEditor } from './table-editor';
import type { BenefitsPageData, BenefitChapterData } from '@/lib/content/types';

interface Props {
  pageData: BenefitsPageData;
  chapters: BenefitChapterData[];
  onPageChange: (data: BenefitsPageData) => void;
  onChaptersChange: (chapters: BenefitChapterData[]) => void;
}

export function BenefitsEditor({ pageData, chapters, onPageChange, onChaptersChange }: Props) {
  const updatePage = (field: keyof BenefitsPageData, value: string) => {
    onPageChange({ ...pageData, [field]: value });
  };

  const updateChapter = (index: number, field: keyof BenefitChapterData, value: any) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    onChaptersChange(updated);
  };

  const addChapter = () => {
    const newChapter: BenefitChapterData = {
      _id: `ch-${Date.now()}`,
      title: 'New Benefit Chapter',
      slug: `new-chapter-${Date.now()}`,
      order: chapters.length + 1,
    };
    onChaptersChange([...chapters, newChapter]);
  };

  const removeChapter = (index: number) => {
    onChaptersChange(chapters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Benefits Overview Page</h3>
        <div className="space-y-4">
          <FieldInput
            label="Page Title"
            value={pageData.title}
            onChange={(v) => updatePage('title', v)}
          />
          <FieldInput
            label="Page Description"
            value={pageData.description}
            onChange={(v) => updatePage('description', v)}
            type="textarea"
          />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Benefit Chapters ({chapters.length})</h3>
        <Button onClick={addChapter} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Chapter
        </Button>
      </div>

      {chapters.map((chapter, idx) => (
        <Card key={chapter._id} className="border-slate-200 bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-slate-400" />
              <h4 className="font-semibold text-slate-900">
                {chapter.title || 'Untitled Chapter'}
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeChapter(idx)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput
              label="Title"
              value={chapter.title}
              onChange={(v) => updateChapter(idx, 'title', v)}
            />
            <FieldInput
              label="Slug"
              value={chapter.slug}
              onChange={(v) => updateChapter(idx, 'slug', v)}
            />
            <FieldInput
              label="Icon"
              value={chapter.icon}
              onChange={(v) => updateChapter(idx, 'icon', v)}
              placeholder="heart, shield, eye..."
            />
            <FieldInput
              label="Image URL"
              value={chapter.image}
              onChange={(v) => updateChapter(idx, 'image', v)}
              type="url"
            />
            <FieldInput
              label="Order"
              value={chapter.order?.toString()}
              onChange={(v) => updateChapter(idx, 'order', parseInt(v) || 0)}
              type="number"
            />
          </div>

          <div className="mt-4">
            <FieldInput
              label="Description"
              value={chapter.description}
              onChange={(v) => updateChapter(idx, 'description', v)}
              type="textarea"
            />
          </div>

          {/* Table Editor */}
          {(chapter.tables && chapter.tables.length > 0 || true) && (
            <div className="mt-4">
              <ChapterTablesEditor
                tables={chapter.tables || []}
                onChange={(tables) => updateChapter(idx, 'tables', tables)}
              />
            </div>
          )}

          {/* Content (Portable Text) - collapsible raw editor */}
          <details className="mt-4">
            <summary className="text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-700">
              Content (Portable Text JSON) — Advanced
            </summary>
            <textarea
              className="w-full h-32 text-xs font-mono border border-slate-300 rounded-md p-2 mt-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={JSON.stringify(chapter.content || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateChapter(idx, 'content', parsed);
                } catch { /* invalid JSON, don't update */ }
              }}
            />
          </details>
        </Card>
      ))}
    </div>
  );
}
