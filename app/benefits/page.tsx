import { BenefitCard } from '@/components/benefit-card';
import { SectionWrapper } from '@/components/section-wrapper';
import { client } from '@/sanity/lib/client';
import { chaptersQuery } from '@/sanity/lib/queries';

export default async function BenefitsPage() {
  const chapters = await client.fetch(chaptersQuery);

  return (
    <div>
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Benefits Overview
          </h1>
          <p className="text-lg text-slate-600">
            Explore our comprehensive benefits packages.
          </p>
        </div>
      </SectionWrapper>

      <SectionWrapper className="bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter: any) => (
            <BenefitCard key={chapter._id} chapter={chapter} />
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}
