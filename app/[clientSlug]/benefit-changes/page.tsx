import { SectionWrapper } from '@/components/section-wrapper';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Plus, CheckCircle } from 'lucide-react';
import { sanityFetch } from '@/sanity/lib/live';
import { client } from '@/sanity/lib/client';
import { benefitChangesQuery, siteSettingsQuery } from '@/sanity/lib/queries';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateStaticParams() {
  const clients = await client.fetch<{ slug: string }[]>(
    `*[_type == "client"]{ "slug": slug.current }`
  );
  return (clients || []).map((client) => ({
    clientSlug: client.slug,
  }));
}

type Props = {
  params: Promise<{ clientSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clientSlug } = await params
  const { data: settings } = await sanityFetch({
    query: siteSettingsQuery,
    params: { clientSlug }
  });
  const clientName = settings?.clientName || 'RS&H';
  return {
    title: `Benefit Changes 2026 - ${clientName} Benefits Portal`,
    description: `Learn about what’s new in 2026 benefits at ${clientName}`,
  }
}

type BenefitChange = {
  _key: string;
  type: 'new' | 'update';
  title: string;
  description: string;
};

type BenefitChangesPageData = {
  title: string;
  description: string;
  alertMessage: string;
  changes: BenefitChange[];
  ctaTitle: string;
  ctaDescription: string;
};

export default async function BenefitChangesPage({ params }: Props) {
  const { clientSlug } = await params
  const { data } = await sanityFetch({
    query: benefitChangesQuery,
    params: { clientSlug }
  });
  const typedData = data as BenefitChangesPageData;

  const newBenefits =
    typedData?.changes?.filter((c: BenefitChange) => c.type === 'new') || [];

  const updatedBenefits =
    typedData?.changes?.filter((c: BenefitChange) => c.type === 'update') || [];

  return (
    <div className="space-y-0">
      {/* Hero */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          {typedData?.title}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          {typedData?.description}
        </p>
      </SectionWrapper>

      {/* Alert Banner */}
      {typedData?.alertMessage && (
        <SectionWrapper className="bg-white">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              {typedData.alertMessage}
            </AlertDescription>
          </Alert>
        </SectionWrapper>
      )}

      {/* New Benefits Section */}
      {newBenefits.length > 0 && (
        <SectionWrapper className="bg-white">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <Plus className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                New Benefits
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newBenefits.map((benefit) => (
                <div
                  key={benefit._key}
                  className="p-6 border border-green-200 bg-green-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* Updated Benefits Section */}
      {updatedBenefits.length > 0 && (
        <SectionWrapper className="bg-slate-50">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                Improved Benefits
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {updatedBenefits.map((benefit) => (
                <div
                  key={benefit._key}
                  className="p-6 border border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* Call to Action */}
      {(typedData?.ctaTitle || typedData?.ctaDescription) && (
        <SectionWrapper className="bg-white">
          <div className="max-w-3xl">
            <div className="p-8 border border-slate-200 rounded-lg bg-gradient-to-br from-blue-50 to-slate-50">
              <div className="flex gap-4 items-start">
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {typedData?.ctaTitle}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {typedData?.ctaDescription}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href={`/${clientSlug}/benefits`}>View All Benefits</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/${clientSlug}/enrollment-checklist`}>
                        Start Enrollment Checklist
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionWrapper>
      )}
    </div>
  );
}
