import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/section-wrapper';
import { ChevronLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { sanityFetch } from '@/sanity/lib/live';
import { chapterBySlugQuery, benefitChaptersQuery, siteSettingsQuery } from '@/sanity/lib/queries';
import { urlFor } from '@/sanity/lib/image';
import { PortableText } from '@portabletext/react';

// ── Unified Table Types ──

type TableColumn = {
  _key: string;
  key: string;
  label: string;
  subLabel?: string;
};

type TableRow = {
  _key: string;
  label: string;
  cells: string[];
  isSection?: boolean;
};

type UnifiedTable = {
  _key: string;
  tableTitle: string;
  tableDescription?: string;
  templateId?: string;
  columns: TableColumn[];
  rows: TableRow[];
};

type ChapterDetail = {
  _id: string;
  title: string;
  description: string;
  slug: string;
  image?: any;
  content?: any[];
  tables?: UnifiedTable[];
};

export async function generateStaticParams() {
  const chapters = await client.fetch<{ slug: string, clientSlug: string }[]>(
    `*[_type == "benefitChapter" && defined(client->slug.current)]{ 
      "slug": slug.current, 
      "clientSlug": client->slug.current 
    }`
  );
  return (chapters || []).map((chapter) => ({
    clientSlug: chapter.clientSlug,
    slug: chapter.slug,
  }));
}

type Props = {
  params: Promise<{ clientSlug: string; slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { clientSlug, slug } = await params;
  const { data: settings } = await sanityFetch({
    query: siteSettingsQuery,
    params: { clientSlug }
  });
  const clientName = settings?.clientName || 'RS&H';
  const chapter: ChapterDetail | null = await client.fetch(chapterBySlugQuery, { slug, clientSlug });

  if (!chapter) {
    return {
      title: `Not Found - ${clientName} Benefits Portal`,
    };
  }

  return {
    title: `${chapter.title} - ${clientName} Benefits Portal`,
    description: chapter.description,
  };
}

// ── Unified Table Renderer ──

function UnifiedTableRenderer({ table }: { table: UnifiedTable }) {
  const columns = table.columns || [];
  const rows = table.rows || [];

  if (columns.length === 0 && rows.length === 0) return null;

  // Detect if columns have sub-labels (e.g., In-network / Out-of-network)
  const hasSubLabels = columns.some(c => c.subLabel);

  // Group columns by label for two-level headers
  type ColumnGroup = { label: string; columns: TableColumn[] };
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

  const totalCols = 1 + columns.length; // label column + value columns

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
                {/* Two-row header: plan names on top, sub-labels below */}
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
              /* Single-row header */
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

// ── Page Component ──

export default async function BenefitDetailPage({ params }: Props) {
  const { clientSlug, slug } = await params;
  const { data: chapter } = await sanityFetch({
    query: chapterBySlugQuery,
    params: { slug, clientSlug }
  });
  const typedChapter = chapter as ChapterDetail | null;

  if (!typedChapter) {
    notFound();
  }

  const imageUrl = typedChapter.image ? urlFor(typedChapter.image).width(1200).height(400).url() : null;
  const hasTables = typedChapter.tables && typedChapter.tables.length > 0;

  return (
    <div>
      {/* Back Link */}
      <SectionWrapper className="bg-slate-50">
        <Link href={`/${clientSlug}/benefits`} className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Benefits
        </Link>
      </SectionWrapper>

      {/* Hero Section */}
      <div className="h-96 w-full overflow-hidden bg-slate-200 flex items-center justify-center text-slate-400">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={typedChapter.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <p className="text-lg text-slate-400">No image available</p>
        )}
      </div>

      {/* Content */}
      <SectionWrapper className="bg-white">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{typedChapter.title}</h1>
          <p className="text-lg text-slate-600 mb-8">{typedChapter.description}</p>

          <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
            {typedChapter.content && typedChapter.content.length > 0 ? (
              <PortableText value={typedChapter.content} />
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
              {typedChapter.tables!.map((table) => (
                <UnifiedTableRenderer key={table._key} table={table} />
              ))}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline">
                <Link href={`/${clientSlug}/benefits`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Benefits
                </Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="#enroll">Enroll in This Benefit</a>
              </Button>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
