import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/section-wrapper';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PortableText } from '@/components/portable-text';
import { getEmployerSlug } from '@/lib/content/get-employer';
import { getPublishedContent, listEmployers } from '@/lib/content';
import type { BenefitChapterData, BenefitTable, TableColumn } from '@/lib/content/types';

type ColumnGroup = { label: string; columns: TableColumn[] };

function UnifiedTableRenderer({ table }: { table: BenefitTable }) {
  const columns = table.columns || [];
  const rows = table.rows || [];

  if (columns.length === 0 && rows.length === 0) return null;

  const hasSubLabels = columns.some(c => c.subLabel);

  const columnGroups: ColumnGroup[] = [];

  if (hasSubLabels) {
    for (const col of columns) {
      const existing = columnGroups.find(g => g.label === col.label);
      if (existing) {
        existing.columns.push(col);
      } else {
        columnGroups.push({ label: col.label, columns: [col] });
      }
    }
  }

  const totalCols = 1 + columns.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-[#1a365d] mb-2">{table.tableTitle}</h2>
      {table.tableDescription && (
        <p className="text-sm text-slate-600 mb-6">{table.tableDescription}</p>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead>
            {hasSubLabels && columnGroups.length > 0 ? (
              <>
                <tr className="bg-[#1a365d] text-white">
                  <th className="px-5 py-4 text-sm font-semibold w-[25%] border-r border-blue-800">
                    {table.tableTitle}
                  </th>
                  {columnGroups.map((group, gIdx) => (
                    <th
                      key={`g-${gIdx}`}
                      colSpan={group.columns.length}
                      className={`px-5 py-4 text-sm font-semibold text-center ${gIdx < columnGroups.length - 1 ? 'border-r border-blue-800' : ''}`}
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                <tr className="bg-[#2d4a7c] text-white">
                  <th className="px-5 py-2 text-xs font-medium border-r border-blue-700" />
                  {columnGroups.map((group, gIdx) =>
                    group.columns.map((col, sIdx) => (
                      <th
                        key={`gs-${gIdx}-${sIdx}`}
                        className={`px-5 py-2 text-xs font-medium text-center ${sIdx === group.columns.length - 1 && gIdx < columnGroups.length - 1 ? 'border-r border-blue-700' : ''}`}
                      >
                        {col.subLabel || ''}
                      </th>
                    ))
                  )}
                </tr>
              </>
            ) : (
              <tr className="bg-[#1a365d] text-white">
                <th className="px-5 py-4 text-sm font-semibold w-[30%] border-r border-blue-800" />
                {columns.map((col, cIdx) => (
                  <th
                    key={col._key || `col-${cIdx}`}
                    className={`px-5 py-4 text-sm font-semibold text-center ${cIdx < columns.length - 1 ? 'border-r border-blue-800' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              if (row.isSection) {
                return (
                  <tr key={row._key} className="bg-[#2d3748]">
                    <td
                      colSpan={totalCols}
                      className="px-5 py-3 text-xs font-bold text-white uppercase tracking-wider"
                    >
                      {row.label}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={row._key}
                  className={`border-b border-slate-100 ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/50 transition-colors`}
                >
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700 border-r border-slate-100">
                    {row.label}
                  </td>
                  {(row.cells || []).map((cell, cIdx) => (
                    <td
                      key={`c-${cIdx}`}
                      className="px-5 py-4 text-sm text-slate-600 text-center bg-blue-50/40"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const employers = listEmployers();
  const params: { slug: string }[] = [];
  for (const emp of employers) {
    try {
      const content = getPublishedContent(emp);
      for (const ch of content.benefitChapters || []) {
        params.push({ slug: ch.slug });
      }
    } catch { /* skip missing content */ }
  }
  return params;
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug: chapterSlug } = await params;
  const employerSlug = await getEmployerSlug();
  const content = await getPublishedContent(employerSlug);
  const clientName = content.siteSettings?.clientName || 'RS&H';
  const chapter = content.benefitChapters?.find(c => c.slug === chapterSlug);

  if (!chapter) {
    return { title: `Not Found - ${clientName} Benefits Portal` };
  }

  return {
    title: `${chapter.title} - ${clientName} Benefits Portal`,
    description: chapter.description,
  };
}

export default async function BenefitDetailPage({ params }: Props) {
  const { slug: chapterSlug } = await params;
  const employerSlug = await getEmployerSlug();
  const content = await getPublishedContent(employerSlug);

  const chapters = content.benefitChapters || [];
  const chapter = chapters.find(c => c.slug === chapterSlug);

  if (!chapter) {
    notFound();
  }

  const currentIndex = chapters.findIndex((c) => c.slug === chapterSlug);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const imageUrl = chapter.image || null;
  const hasTables = chapter.tables && chapter.tables.length > 0;

  return (
    <div>
      {/* Back Link */}
      <SectionWrapper className="bg-slate-50">
        <Link href="/benefits" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Benefits
        </Link>
      </SectionWrapper>

      {/* Hero Section */}
      <div className="h-96 w-full overflow-hidden bg-slate-200 flex items-center justify-center text-slate-400">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={chapter.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <p className="text-lg text-slate-400">No image available</p>
        )}
      </div>

      {/* Content */}
      <SectionWrapper className="bg-white">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{chapter.title}</h1>
          <div className="text-lg text-slate-600 mb-8">
            {chapter.description}
          </div>

          <div className="space-y-6">
            {chapter.content && chapter.content.length > 0 ? (
              <PortableText value={chapter.content} />
            ) : (
              <p>
                This benefits chapter provides important information about your coverage options and how to make the
                most of your benefits. For more detailed information or to enroll, please visit your benefits portal
                or contact the HR team.
              </p>
            )}
          </div>

          {/* Unified Benefit Tables */}
          {hasTables && (
            <div className="mt-10 space-y-12">
              {chapter.tables!.map((table) => (
                <UnifiedTableRenderer key={table._key} table={table} />
              ))}
            </div>
          )}

          {/* Previous / Next Chapter Navigation */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex justify-between items-stretch gap-4">
              {prevChapter ? (
                <Button asChild variant="outline" className="flex-1 h-auto py-4 px-5">
                  <Link href={`/benefits/${prevChapter.slug}`} className="flex items-center gap-3 no-underline">
                    <ChevronLeft className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <div className="text-left">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Previous</div>
                      <div className="text-sm font-semibold text-slate-700 mt-0.5">{prevChapter.title}</div>
                    </div>
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="flex-1 h-auto py-4 px-5">
                  <Link href="/benefits" className="flex items-center gap-3 no-underline">
                    <ChevronLeft className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <div className="text-left">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Back to</div>
                      <div className="text-sm font-semibold text-slate-700 mt-0.5">All Benefits</div>
                    </div>
                  </Link>
                </Button>
              )}

              {nextChapter ? (
                <Button asChild variant="outline" className="flex-1 h-auto py-4 px-5">
                  <Link href={`/benefits/${nextChapter.slug}`} className="flex items-center justify-end gap-3 no-underline">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Next</div>
                      <div className="text-sm font-semibold text-slate-700 mt-0.5">{nextChapter.title}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="flex-1 h-auto py-4 px-5">
                  <Link href="/benefits" className="flex items-center justify-end gap-3 no-underline">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Back to</div>
                      <div className="text-sm font-semibold text-slate-700 mt-0.5">All Benefits</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
