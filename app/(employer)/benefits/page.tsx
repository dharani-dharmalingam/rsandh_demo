import { BenefitCard } from '@/components/benefit-card';
import { SectionWrapper } from '@/components/section-wrapper';
import { getEmployerSlug } from '@/lib/content/get-employer';
import { getPublishedContent } from '@/lib/content';
import type { BenefitChapterData } from '@/lib/content/types';

export default async function BenefitsPage() {
  const slug = await getEmployerSlug();
  const content = await getPublishedContent(slug);

  const pageData = content.benefitsPage;
  const chapters = content.benefitChapters || [];

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
          {chapters.map((chapter: BenefitChapterData) => (
            <BenefitCard key={chapter._id} chapter={chapter} />
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}
