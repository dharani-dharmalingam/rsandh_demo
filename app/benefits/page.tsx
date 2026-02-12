import { BenefitCard } from '@/components/benefit-card';
import { SectionWrapper } from '@/components/section-wrapper';
import { sanityFetch } from '@/sanity/lib/live';
import { benefitsPageQuery, benefitChaptersQuery } from '@/sanity/lib/queries';

type Chapter = {
  _id: string;
  title: string;
  description: string;
  slug: string;
  icon?: string;
  image?: any;
};

type BenefitsPageData = {
  title: string;
  description: string;
};

export default async function BenefitsPage() {
  const [{ data: pageData }, { data: chapters }] =
    await Promise.all([
      sanityFetch({ query: benefitsPageQuery }),
      sanityFetch({ query: benefitChaptersQuery }),
    ]);

  return (
    <div>
      {/* Hero */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {pageData?.title}
          </h1>
          <p className="text-lg text-slate-600">
            {pageData?.description}
          </p>
        </div>
      </SectionWrapper>

      {/* Chapters Grid */}
      <SectionWrapper className="bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(chapters as Chapter[])?.map((chapter: Chapter) => (
            <BenefitCard key={chapter._id} chapter={chapter} />
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}

