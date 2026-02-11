import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/section-wrapper';
import { BENEFIT_CHAPTERS, getBenefitChapterBySlug } from '@/lib/data';
import { ChevronLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return BENEFIT_CHAPTERS.map((chapter) => ({
    slug: chapter.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = getBenefitChapterBySlug(slug);

  if (!chapter) {
    return {
      title: 'Not Found - RS&H Benefits Portal',
    };
  }

  return {
    title: `${chapter.title} - RS&H Benefits Portal`,
    description: chapter.description,
  };
}

export default async function BenefitDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = getBenefitChapterBySlug(slug);

  if (!chapter) {
    notFound();
  }

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={chapter.image || "/placeholder.svg"}
          alt={chapter.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <SectionWrapper className="bg-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{chapter.title}</h1>
          <p className="text-lg text-slate-600 mb-8">{chapter.description}</p>

          <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
            <p>{chapter.fullContent}</p>
            <p>
              This benefits chapter provides important information about your coverage options and how to make the
              most of your benefits. For more detailed information or to enroll, please visit your benefits portal
              or contact the HR team.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline">
                <Link href="/benefits">
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
