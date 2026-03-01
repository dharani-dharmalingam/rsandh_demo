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

type PlanColumnDef = {
  _key: string;
  planName: string;
  subtitle?: string;
};

type PlanValue = {
  _key: string;
  inNetwork: string;
  outOfNetwork: string;
};

type PlanDetailRow = {
  _key: string;
  label: string;
  description?: string;
  inNetwork: string;
  outOfNetwork?: string;
  frequency?: string;
  isSection?: boolean;
  spanColumns?: boolean;
  planValues?: PlanValue[];
};

type PlanDetailTable = {
  _key: string;
  tableTitle: string;
  tableDescription?: string;
  planColumns?: PlanColumnDef[];
  rows: PlanDetailRow[];
};


type PremiumTier = {
  _key: string;
  tierName: string;
  amount: string;
};

type PremiumTable = {
  _key: string;
  planName: string;
  sectionTitle: string;
  sectionDescription?: string;
  tiers: PremiumTier[];
};

type DynamicTableRow = {
  _key: string;
  cells: string[];
  isSection?: boolean;
};

type DynamicTable = {
  _key: string;
  tableTitle: string;
  tableDescription?: string;
  headers: string[];
  rows: DynamicTableRow[];
};

type ChapterDetail = {
  _id: string;
  title: string;
  description: string;
  slug: string;
  image?: any;
  content?: any[];
  planDetails?: PlanDetailTable[];
  premiumTables?: PremiumTable[];
  dynamicTables?: DynamicTable[];
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
  const hasPlanDetails = typedChapter.planDetails && typedChapter.planDetails.length > 0;
  const hasPremiumTables = typedChapter.premiumTables && typedChapter.premiumTables.length > 0;
  const hasDynamicTables = typedChapter.dynamicTables && typedChapter.dynamicTables.length > 0;

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

          {/* Plan Details Tables (single-plan and multi-plan) */}
          {hasPlanDetails && (
            <div className="mt-10 space-y-12">
              {typedChapter.planDetails!.map((table) => {
                const isMultiPlan = table.planColumns && table.planColumns.length > 0;

                if (isMultiPlan) {
                  // ── Multi-Plan Comparison Table ──
                  const planCols = table.planColumns!;

                  // Detect if the table uses in-network/out-of-network per plan
                  // or just a single value per plan (like premium overview tables)
                  const hasInOutNetwork = table.rows.some(
                    (r) => r.planValues?.some((pv) => pv.outOfNetwork && pv.outOfNetwork !== '—' && pv.outOfNetwork !== '-')
                  );

                  const totalValueCols = hasInOutNetwork ? planCols.length * 2 : planCols.length;
                  const totalCols = 1 + totalValueCols;

                  return (
                    <div key={table._key} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-[#1a365d] mb-2">{table.tableTitle}</h2>
                      {table.tableDescription && (
                        <p className="text-sm text-slate-600 mb-2">{table.tableDescription}</p>
                      )}
                      {/* Auto-generate plan count text */}
                      {planCols.length > 0 && (
                        <p className="text-sm font-medium text-[#1a365d] mb-6">
                          {planCols.length} {table.tableTitle?.toLowerCase().replace(' plans', '')} plan{planCols.length !== 1 ? 's' : ''} available: {planCols.map(c => c.planName).join(', ')}
                        </p>
                      )}
                      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                        <table className="w-full text-left">
                          <thead>
                            {hasInOutNetwork ? (
                              <>
                                {/* Two-row header for In-network / Out-of-network */}
                                <tr className="bg-[#1a365d] text-white">
                                  <th className="px-5 py-4 text-sm font-semibold w-[25%] border-r border-blue-800">
                                    {table.tableTitle}
                                  </th>
                                  {planCols.map((col: PlanColumnDef, cIdx: number) => (
                                    <th
                                      key={col._key || `col-${cIdx}`}
                                      colSpan={2}
                                      className={`px-5 py-4 text-sm font-semibold text-center ${cIdx < planCols.length - 1 ? 'border-r border-blue-800' : ''}`}
                                    >
                                      {col.planName}
                                      {col.subtitle && (
                                        <span className="block text-xs font-normal text-blue-200 mt-0.5">
                                          ({col.subtitle})
                                        </span>
                                      )}
                                    </th>
                                  ))}
                                </tr>
                                <tr className="bg-[#2d4a7c] text-white">
                                  <th className="px-5 py-2 text-xs font-medium border-r border-blue-700" />
                                  {planCols.map((col: PlanColumnDef, cIdx: number) => (
                                    <React.Fragment key={`${col._key || cIdx}-subhdr`}>
                                      <th className="px-5 py-2 text-xs font-medium text-center">In-network</th>
                                      <th className={`px-5 py-2 text-xs font-medium text-center ${cIdx < planCols.length - 1 ? 'border-r border-blue-700' : ''}`}>Out-of-network</th>
                                    </React.Fragment>
                                  ))}
                                </tr>
                              </>
                            ) : (
                              /* Single-row header: just plan names (for premium/overview tables) */
                              <tr className="bg-[#1a365d] text-white">
                                <th className="px-5 py-4 text-sm font-semibold w-[30%]" />
                                {planCols.map((col: PlanColumnDef, cIdx: number) => (
                                  <th
                                    key={col._key || `col-${cIdx}`}
                                    className="px-5 py-4 text-sm font-semibold text-center"
                                  >
                                    {col.planName}
                                  </th>
                                ))}
                              </tr>
                            )}
                          </thead>

                          <tbody>
                            {table.rows.map((detail, index) => {
                              if (detail.isSection) {
                                return (
                                  <tr key={detail._key} className="bg-[#2d3748]">
                                    <td
                                      colSpan={totalCols}
                                      className="px-5 py-3 text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                      {detail.label}
                                    </td>
                                  </tr>
                                );
                              }

                              if (detail.spanColumns) {
                                return (
                                  <tr
                                    key={detail._key}
                                    className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                  >
                                    <td className="px-5 py-3 text-sm font-medium text-slate-700">{detail.label}</td>
                                    <td colSpan={totalValueCols} className="px-5 py-3 text-sm text-slate-600 text-center bg-blue-50/40">
                                      {detail.planValues?.[0]?.inNetwork || detail.inNetwork || '—'}
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr
                                  key={detail._key}
                                  className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/50 transition-colors`}
                                >
                                  <td className="px-5 py-3 text-sm font-medium text-slate-700 border-r border-slate-100">
                                    {detail.label}
                                    {detail.description && (
                                      <span className="block text-xs text-slate-400 mt-0.5">{detail.description}</span>
                                    )}
                                  </td>
                                  {(detail.planValues || []).map((pv: PlanValue, pvIdx: number) => (
                                    <React.Fragment key={`${detail._key}-pv${pvIdx}`}>
                                      <td className="px-5 py-3 text-sm text-slate-600 text-center">
                                        {pv.inNetwork || '—'}
                                      </td>
                                      {hasInOutNetwork && (
                                        <td className={`px-5 py-3 text-sm text-slate-600 text-center ${pvIdx < planCols.length - 1 ? 'border-r border-slate-100' : ''}`}>
                                          {pv.outOfNetwork || '—'}
                                        </td>
                                      )}
                                    </React.Fragment>
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

                // ── Single-Plan Table (existing behavior) ──
                const tableHasOutOfNetwork = table.rows.some(
                  (r) => r.outOfNetwork && r.outOfNetwork !== '—' && r.outOfNetwork !== '-' && r.outOfNetwork !== '---'
                );
                const tableHasFrequency = table.rows.some(
                  (r) => r.frequency && r.frequency.trim() !== ''
                );
                const tableTotalCols = 1 + (tableHasOutOfNetwork ? 2 : 1) + (tableHasFrequency ? 1 : 0);
                const tableValueCols = (tableHasOutOfNetwork ? 2 : 1) + (tableHasFrequency ? 1 : 0);

                return (
                  <div key={table._key}>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{table.tableTitle}</h2>
                    {table.tableDescription && (
                      <p className="text-sm text-slate-500 mb-6">{table.tableDescription}</p>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#1a365d] text-white">
                            <th className="px-5 py-4 text-sm font-semibold w-[30%]" />
                            <th className="px-5 py-4 text-sm font-semibold text-center uppercase tracking-wider">
                              {tableHasOutOfNetwork ? 'In-Network' : 'Details'}
                            </th>
                            {tableHasOutOfNetwork && (
                              <th className="px-5 py-4 text-sm font-semibold text-center uppercase tracking-wider">Non-Network</th>
                            )}
                            {tableHasFrequency && (
                              <th className="px-5 py-4 text-sm font-semibold text-center uppercase tracking-wider">Frequency</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((detail, index) => {
                            if (detail.isSection) {
                              return (
                                <tr key={detail._key} className="bg-[#2d3748]">
                                  <td
                                    colSpan={tableTotalCols}
                                    className="px-5 py-3 text-xs font-bold text-white uppercase tracking-wider"
                                  >
                                    {detail.label}
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr
                                key={detail._key}
                                className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                  } hover:bg-blue-50/50 transition-colors`}
                              >
                                <td className="px-5 py-4 text-sm text-slate-700 text-right">
                                  <span className="font-semibold">{detail.label}</span>
                                  {detail.description && (
                                    <span className="block text-xs text-slate-400 mt-0.5">{detail.description}</span>
                                  )}
                                </td>
                                {detail.spanColumns ? (
                                  <td
                                    colSpan={tableValueCols}
                                    className="px-5 py-4 text-sm text-slate-600 text-center bg-blue-50/40"
                                  >
                                    {detail.inNetwork}
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-5 py-4 text-sm text-slate-600 text-center bg-blue-50/40">
                                      {detail.inNetwork}
                                    </td>
                                    {tableHasOutOfNetwork && (
                                      <td className="px-5 py-4 text-sm text-slate-600 text-center bg-blue-50/40">
                                        {detail.outOfNetwork || '—'}
                                      </td>
                                    )}
                                    {tableHasFrequency && (
                                      <td className="px-5 py-4 text-sm text-slate-600 text-center">
                                        {detail.frequency || ''}
                                      </td>
                                    )}
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Premium Contribution Tables */}
          {hasPremiumTables && (
            <div className="mt-10 space-y-12">
              {typedChapter.premiumTables!.map((table) => (
                <div key={table._key}>
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">{table.sectionTitle}</h2>
                  {table.sectionDescription && (
                    <p className="text-sm text-slate-600 mb-6 max-w-2xl">{table.sectionDescription}</p>
                  )}
                  <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm max-w-2xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th colSpan={2} className="px-6 py-3 text-center text-sm font-bold text-[#1a365d] tracking-wide">
                            {table.planName}
                          </th>
                        </tr>
                        <tr className="bg-[#1a365d]">
                          <th className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                            Bi-Weekly Contributions
                          </th>
                          <th className="px-6 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {table.tiers.map((tier, index) => (
                          <tr
                            key={tier._key}
                            className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'
                              } hover:bg-blue-50/70 transition-colors`}
                          >
                            <td className="px-6 py-3 text-sm font-medium text-slate-700 text-right">
                              {tier.tierName}
                            </td>
                            <td className="px-6 py-3 text-sm text-slate-600 text-center bg-blue-50/60">
                              {tier.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Tables (Exact PDF Layout) */}
          {hasDynamicTables && (
            <div className="mt-10 space-y-12">
              {typedChapter.dynamicTables!.map((table) => {
                const numCols = table.headers.length;

                // ── Detect grouped headers ──
                // Headers like ["Dental", "Core Plan In-network", "Core Plan Out-of-network",
                //   "Enhanced Plan In-network", "Enhanced Plan Out-of-network"]
                // should be grouped into plan-name parents with In/Out sub-headers.
                const networkSuffixes = [
                  { pattern: /\s+in[- ]?network$/i, label: 'In-network' },
                  { pattern: /\s+out[- ]?of[- ]?network$/i, label: 'Out-of-network' },
                ];

                type GroupedHeader = { parent: string; subHeaders: { label: string; colIndex: number }[] };
                const groups: (GroupedHeader | { flat: string; colIndex: number })[] = [];
                let isGrouped = false;

                // Skip first header (row label column) and analyze the rest
                if (table.headers.length > 2) {
                  const valueHeaders = table.headers.slice(1);
                  let i = 0;
                  while (i < valueHeaders.length) {
                    const h = valueHeaders[i];
                    const colIdx = i + 1; // +1 because we skipped header[0]

                    // Try to match an in-network suffix
                    const inMatch = networkSuffixes[0].pattern.exec(h);
                    if (inMatch) {
                      const prefix = h.slice(0, inMatch.index).trim();
                      // Look ahead for matching out-of-network header with same prefix
                      if (i + 1 < valueHeaders.length) {
                        const nextH = valueHeaders[i + 1];
                        const outMatch = networkSuffixes[1].pattern.exec(nextH);
                        if (outMatch) {
                          const nextPrefix = nextH.slice(0, outMatch.index).trim();
                          if (prefix.toLowerCase() === nextPrefix.toLowerCase()) {
                            // Found a grouped pair
                            groups.push({
                              parent: prefix,
                              subHeaders: [
                                { label: 'In-network', colIndex: colIdx },
                                { label: 'Out-of-network', colIndex: colIdx + 1 },
                              ],
                            });
                            isGrouped = true;
                            i += 2;
                            continue;
                          }
                        }
                      }
                    }

                    // No grouping for this header
                    groups.push({ flat: h, colIndex: colIdx });
                    i++;
                  }
                }

                // Only use grouped rendering if we actually found groups
                const useGroupedHeaders = isGrouped && groups.some(g => 'parent' in g);
                const totalCols = numCols;

                return (
                  <div key={table._key} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-[#1a365d] mb-2">{table.tableTitle}</h2>
                    {table.tableDescription && (
                      <p className="text-sm text-slate-600 mb-6">{table.tableDescription}</p>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                      <table className="w-full text-left">
                        <thead>
                          {useGroupedHeaders ? (
                            <>
                              {/* Two-row header: plan names on top, In/Out sub-headers below */}
                              <tr className="bg-[#1a365d] text-white">
                                <th className="px-5 py-4 text-sm font-semibold w-[25%] border-r border-blue-800">
                                  {table.headers[0]}
                                </th>
                                {groups.map((g, gIdx) => {
                                  if ('parent' in g) {
                                    return (
                                      <th
                                        key={`g-${gIdx}`}
                                        colSpan={g.subHeaders.length}
                                        className={`px-5 py-4 text-sm font-semibold text-center ${gIdx < groups.length - 1 ? 'border-r border-blue-800' : ''}`}
                                      >
                                        {g.parent}
                                      </th>
                                    );
                                  }
                                  return (
                                    <th
                                      key={`g-${gIdx}`}
                                      rowSpan={2}
                                      className={`px-5 py-4 text-sm font-semibold text-center ${gIdx < groups.length - 1 ? 'border-r border-blue-800' : ''}`}
                                    >
                                      {g.flat}
                                    </th>
                                  );
                                })}
                              </tr>
                              <tr className="bg-[#2d4a7c] text-white">
                                <th className="px-5 py-2 text-xs font-medium border-r border-blue-700" />
                                {groups.map((g, gIdx) => {
                                  if ('parent' in g) {
                                    return g.subHeaders.map((sub, sIdx) => (
                                      <th
                                        key={`gs-${gIdx}-${sIdx}`}
                                        className={`px-5 py-2 text-xs font-medium text-center ${sIdx === g.subHeaders.length - 1 && gIdx < groups.length - 1 ? 'border-r border-blue-700' : ''}`}
                                      >
                                        {sub.label}
                                      </th>
                                    ));
                                  }
                                  // flat headers already have rowSpan=2, skip
                                  return null;
                                })}
                              </tr>
                            </>
                          ) : (
                            /* Single-row header (unchanged behavior) */
                            <tr className="bg-[#1a365d] text-white">
                              {table.headers.map((header, hIdx) => (
                                <th
                                  key={`h-${hIdx}`}
                                  className={`px-5 py-4 text-sm font-semibold ${hIdx === 0 ? 'text-left' : 'text-center'
                                    } ${hIdx < numCols - 1 ? 'border-r border-blue-800' : ''}`}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {table.rows.map((row, rIdx) => {
                            if (row.isSection) {
                              return (
                                <tr key={row._key} className="bg-[#2d3748]">
                                  <td
                                    colSpan={totalCols}
                                    className="px-5 py-3 text-xs font-bold text-white uppercase tracking-wider"
                                  >
                                    {row.cells[0]}
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr
                                key={row._key}
                                className={`border-b border-slate-100 ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                  } hover:bg-blue-50/50 transition-colors`}
                              >
                                {row.cells.map((cell, cIdx) => (
                                  <td
                                    key={`c-${cIdx}`}
                                    className={`px-5 py-4 text-sm ${cIdx === 0
                                      ? 'font-semibold text-slate-700 border-r border-slate-100'
                                      : 'text-slate-600 text-center bg-blue-50/40'
                                      }`}
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
              })}
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
