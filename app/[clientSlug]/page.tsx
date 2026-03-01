import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionWrapper } from '@/components/section-wrapper';
import { BenefitCard } from '@/components/benefit-card';
import { ImportantContacts } from '@/components/important-contacts';
import { sanityFetch } from '@/sanity/lib/live';
import { client } from '@/sanity/lib/client';
import { benefitChaptersQuery, openEnrollmentQuery, retirementPlanningQuery, siteSettingsQuery } from '@/sanity/lib/queries';
import { FileText, Calendar, HelpCircle, CheckSquare, TrendingUp } from 'lucide-react';
import { Metadata } from 'next';

export async function generateStaticParams() {
  const clients = await client.fetch<{ slug: string }[]>(
    `*[_type == "client"]{ "slug": slug.current }`
  );
  return (clients || []).map((client) => ({
    clientSlug: client.slug,
  }));
}

type BenefitChapter = {
  _id: string;
  title: string;
  description: string;
  slug: string;
  icon?: string;
  image?: any;
};

type OpenEnrollmentData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  enrollmentLink?: string;
  benefitsGuideUrl?: string;
  videoUrl?: string;
  daysLeftLabel?: string;
  periodLabel?: string;
  statusTitle?: string;
  statusDescription?: string;
  checklistLabel?: string;
  checklistSubtext?: string;
  changesLabel?: string;
  changesSubtext?: string;
  enrollLabel?: string;
  enrollSubtext?: string;
};

type RetirementData = {
  heroTitle: string;
  heroDescription: string;
  heroVideoUrl?: string;
};

function computeDaysLeft(endDate: string | undefined): number {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/');
  }
  if (url.includes('vimeo.com/')) {
    return url.replace('vimeo.com/', 'player.vimeo.com/video/');
  }
  return url;
}

export async function generateMetadata({ params }: { params: Promise<{ clientSlug: string }> }): Promise<Metadata> {
  const { clientSlug } = await params
  const { data: settings } = await sanityFetch({
    query: siteSettingsQuery,
    params: { clientSlug }
  });
  const clientName = settings?.clientName || 'RS&H';
  return {
    title: `${clientName} Benefits Portal`,
    description: `Welcome to the ${clientName} Benefits Portal. Access your health, retirement, and financial wellbeing resources.`,
  }
}

export default async function HomePage({ params }: { params: Promise<{ clientSlug: string }> }) {
  const { clientSlug } = await params;
  const [{ data: chapters }, { data: enrollment }, { data: retirement }, { data: settings }] = await Promise.all([
    sanityFetch({ query: benefitChaptersQuery, params: { clientSlug } }),
    sanityFetch({ query: openEnrollmentQuery, params: { clientSlug } }),
    sanityFetch({ query: retirementPlanningQuery, params: { clientSlug } }),
    sanityFetch({ query: siteSettingsQuery, params: { clientSlug } }),
  ]);

  const typedChapters = (chapters || []) as BenefitChapter[];
  const typedEnrollment = enrollment as OpenEnrollmentData;
  const typedRetirement = retirement as RetirementData;

  const previewChapters = typedChapters.slice(0, 6);
  const daysLeft = computeDaysLeft(typedEnrollment?.endDate);

  return (
    <div className="space-y-0">
      {/* Hero Section - Welcome to Company */}
      <div className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/welcomebg.png')`,
          }}
        >
          <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px]" />
        </div>

        <SectionWrapper className="relative z-10 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                Welcome to {settings?.clientName || 'RS&H'}
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                Your comprehensive benefits portal designed to help you make informed decisions about your health, retirement, and financial wellbeing.
              </p>
              {typedEnrollment?.benefitsGuideUrl ? (
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-14 px-8 text-lg font-semibold shadow-lg shadow-blue-500/10">
                  <a href={typedEnrollment.benefitsGuideUrl} download>
                    <FileText className="mr-3 h-6 w-6" />
                    Download Benefits Guide
                  </a>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-14 px-8 text-lg font-semibold shadow-lg shadow-blue-500/10">
                  <a href="/benefits-guide.pdf" download>
                    <FileText className="mr-3 h-6 w-6" />
                    Download Benefits Guide
                  </a>
                </Button>
              )}
            </div>
            <div className="h-80 md:h-96 rounded-2xl bg-white/40 backdrop-blur-md border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-xl">
              {typedEnrollment?.videoUrl ? (
                <iframe
                  src={getEmbedUrl(typedEnrollment.videoUrl)!}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center">
                  <div className="text-7xl mb-4 text-slate-200">▶</div>
                  <p className="text-slate-500 font-medium">Video Placeholder</p>
                </div>
              )}
            </div>
          </div>
        </SectionWrapper>
      </div>

      {/* Open Enrollment Section */}
      <SectionWrapper className="bg-white">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {typedEnrollment?.title || 'Welcome to Open Enrollment'}
          </h2>
          <p className="text-slate-600 mb-8">
            {typedEnrollment?.description || 'Review and update your benefits selections'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Days Left Card */}
          <Card className="p-6 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">{typedEnrollment?.daysLeftLabel || 'Days Left'}</p>
                <p className="text-4xl font-bold text-blue-900">{daysLeft}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-300" />
            </div>
          </Card>

          {/* Dates Card */}
          <Card className="p-6 border-slate-200">
            <p className="text-sm text-slate-600 font-medium mb-2">{typedEnrollment?.periodLabel || 'Open Enrollment Period'}</p>
            <p className="text-slate-900 font-medium mb-1">{formatDate(typedEnrollment?.startDate)}</p>
            <p className="text-slate-600 text-sm mb-4"></p>
            <p className="text-slate-900 font-medium">{formatDate(typedEnrollment?.endDate)}</p>
          </Card>

          {/* Status Card */}
          <Card className="p-6 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <CheckSquare className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-green-600 font-medium">{typedEnrollment?.statusTitle || 'Action Needed'}</p>
                <p className="text-slate-700 text-sm mt-1">{typedEnrollment?.statusDescription || 'Review and update your selections now'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="h-auto p-4 justify-start flex-col items-start bg-transparent">
            <Link href={`/${clientSlug}/enrollment-checklist`}>
              <span className="font-semibold text-blue-600">{typedEnrollment?.checklistLabel || 'Review Enrollment Checklist'}</span>
              <span className="text-sm text-slate-600">{typedEnrollment?.checklistSubtext || 'Prepare for open enrollment'}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 justify-start flex-col items-start bg-transparent">
            <Link href={`/${clientSlug}/benefit-changes`}>
              <span className="font-semibold text-blue-600">{typedEnrollment?.changesLabel || 'Discover Benefit Changes'}</span>
              <span className="text-sm text-slate-600">{typedEnrollment?.changesSubtext || "What's new for 2026"}</span>
            </Link>
          </Button>
          <Button asChild className="h-auto p-4 justify-start flex-col items-start bg-blue-600 hover:bg-blue-700">
            <a href={typedEnrollment?.enrollmentLink || '#enroll'}>
              <span className="font-semibold">{typedEnrollment?.enrollLabel || 'Enroll Now'}</span>
              <span className="text-sm text-blue-100">{typedEnrollment?.enrollSubtext || 'Complete your enrollment'}</span>
            </a>
          </Button>
        </div>
      </SectionWrapper>

      {/* Retirement Planning Section */}
      <div className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-center bg-no-repeat bg-cover"
          style={{
            backgroundImage: `url('/images/retirement.png')`,
          }}
        >
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]" />
        </div>

        <SectionWrapper className="relative z-10 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="h-80 md:h-96 rounded-2xl bg-white/40 backdrop-blur-md border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-xl">
                {typedRetirement?.heroVideoUrl ? (
                  <iframe
                    src={getEmbedUrl(typedRetirement.heroVideoUrl)!}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-7xl mb-4 text-slate-200">▶</div>
                    <p className="text-slate-500 font-medium">Video Placeholder</p>
                  </div>
                )}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">Retirement Planning</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                {typedRetirement?.heroTitle || 'Plan for Your Future'}
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
                {typedRetirement?.heroDescription || 'Learn about retirement plans, investment options, and strategies to help you achieve your long-term financial goals.'}
              </p>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-14 px-10 text-lg font-semibold shadow-lg shadow-blue-500/10">
                <Link href={`/${clientSlug}/retirement-planning`}>Learn More</Link>
              </Button>
            </div>
          </div>
        </SectionWrapper>
      </div>

      {/* Benefits Grid Section */}
      <SectionWrapper className="bg-white">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Benefits Designed For You</h2>
          <p className="text-slate-600">Explore our comprehensive benefits packages across health, wellness, and retirement.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {previewChapters.map((chapter) => (
            <BenefitCard key={chapter._id} chapter={chapter} clientSlug={clientSlug} />
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Link href={`/${clientSlug}/benefits`}>View All Benefits</Link>
          </Button>
        </div>
      </SectionWrapper>

      {/* Help Section */}
      <SectionWrapper className="bg-blue-100">
        <div className="max-w-2xl">
          <div className="flex gap-4 items-start mb-6">
            <HelpCircle className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Need Help?</h2>
              <p className="text-slate-600 mb-6">
                Our Benefits Assistant is available 24/7 to answer your questions. Use the chat button in the bottom right corner, or contact our HR team directly.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">Contact Support</Button>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Quick Access Section */}
      <SectionWrapper className="bg-white">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(settings?.quickAccess || []).map((item: any, i: number) => (
            <Card key={i} className="p-8 hover:shadow-xl transition-all border-slate-200 group relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                  {item.iconName === 'building' && <FileText className="h-6 w-6 text-blue-600" />}
                  {item.iconName === 'message-square' && <HelpCircle className="h-6 w-6 text-blue-600" />}
                  {item.iconName === 'mail' && <HelpCircle className="h-6 w-6 text-blue-600" />}
                  {item.iconName === 'file-text' && <FileText className="h-6 w-6 text-blue-600" />}
                  {!item.iconName && <HelpCircle className="h-6 w-6 text-blue-600" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {item.description}
              </p>
              <Link
                href={item.title.toLowerCase().includes('contact') ? `/${clientSlug}/contacts` : (item.href || '#')}
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                target={(!item.title.toLowerCase().includes('contact') && item.href?.startsWith('http')) ? '_blank' : undefined}
                rel={(!item.title.toLowerCase().includes('contact') && item.href?.startsWith('http')) ? 'noopener noreferrer' : undefined}
              >
                Go to {item.title}
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </Card>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}
