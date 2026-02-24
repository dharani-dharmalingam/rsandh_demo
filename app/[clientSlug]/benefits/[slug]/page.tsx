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

type PlanDetail = {
  _key: string;
  label: string;
  description?: string;
  inNetwork: string;
  outOfNetwork?: string;
  frequency?: string;
  isSection?: boolean;
  spanColumns?: boolean;
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

type ChapterDetail = {
  _id: string;
  title: string;
  description: string;
  slug: string;
  image?: any;
  content?: any[];
  planDetails?: PlanDetail[];
  premiumTables?: PremiumTable[];
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
  const hasOutOfNetwork = hasPlanDetails && typedChapter.planDetails!.some(
    (d) => d.outOfNetwork && d.outOfNetwork !== '—' && d.outOfNetwork !== '-'
  );
  const hasFrequency = hasPlanDetails && typedChapter.planDetails!.some(
    (d) => d.frequency && d.frequency.trim() !== ''
  );
  const totalCols = 1 + (hasOutOfNetwork ? 2 : 1) + (hasFrequency ? 1 : 0);

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

          {/* Plan Details Table */}
          {hasPlanDetails && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Plan Benefits Summary</h2>
              <p className="text-sm text-slate-500 mb-6">Comprehensive coverage details for {typedChapter.title}</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#1a365d] text-white">
                      <th className="px-5 py-4 text-sm font-semibold w-[30%]" />
                      <th className="px-5 py-4 text-sm font-semibold text-center uppercase tracking-wider">
                        {hasOutOfNetwork ? 'In-Network' : 'Details'}
                      </th>
                      {hasOutOfNetwork && (
                        <th className="px-5 py-4 text-sm font-semibold text-center uppercase tracking-wider">Non-Network</th>
                      )}
                      {hasFrequency && (
                        <th className="px-5 py-4 text-sm font-semibold text-center uppercase tracking-wider">Frequency</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {typedChapter.planDetails!.map((detail, index) => {
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

                      const valueCols = (hasOutOfNetwork ? 2 : 1) + (hasFrequency ? 1 : 0);

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
                              colSpan={valueCols}
                              className="px-5 py-4 text-sm text-slate-600 text-center bg-blue-50/40"
                            >
                              {detail.inNetwork}
                            </td>
                          ) : (
                            <>
                              <td className="px-5 py-4 text-sm text-slate-600 text-center bg-blue-50/40">
                                {detail.inNetwork}
                              </td>
                              {hasOutOfNetwork && (
                                <td className="px-5 py-4 text-sm text-slate-600 text-center bg-blue-50/40">
                                  {detail.outOfNetwork || '—'}
                                </td>
                              )}
                              {hasFrequency && (
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

