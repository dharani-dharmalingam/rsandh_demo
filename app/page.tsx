import { headers } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionWrapper } from '@/components/section-wrapper';
import { BenefitCard } from '@/components/benefit-card';
import { FileText, HelpCircle, TrendingUp, Building2, Globe, Building, LayoutGrid } from 'lucide-react';
import { Metadata } from 'next';
import { listEmployers, getPublishedContent } from '@/lib/content';
import type { BenefitChapterData, OpenEnrollmentData, RetirementPlanningData } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

function getEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
  if (url.includes('vimeo.com/')) return url.replace('vimeo.com/', 'player.vimeo.com/video/');
  return url;
}

async function getSlug(): Promise<string | null> {
  const h = await headers();
  return h.get('x-employer-slug') || null;
}

export async function generateMetadata(): Promise<Metadata> {
  const slug = await getSlug();
  if (!slug) {
    return { title: 'Benefits Portal Directory' };
  }
  try {
    const content = getPublishedContent(slug);
    const name = content.siteSettings?.clientName || slug;
    return {
      title: `${name} Benefits Portal`,
      description: `Welcome to the ${name} Benefits Portal.`,
    };
  } catch {
    return { title: 'Benefits Portal Directory' };
  }
}

export default async function RootPage() {
  const slug = await getSlug();

  if (slug) {
    try {
      const content = getPublishedContent(slug);
      return <EmployerHomePage content={content} />;
    } catch {
      // Fall through to directory if content not found
    }
  }

  return <DirectoryPage />;
}

// ── Employer Home Page ──

function EmployerHomePage({ content }: { content: ReturnType<typeof getPublishedContent> }) {
  const chapters = content.benefitChapters || [];
  const enrollment = content.openEnrollment as OpenEnrollmentData;
  const retirement = content.retirementPlanning as RetirementPlanningData;
  const settings = content.siteSettings;
  const previewChapters = chapters.slice(0, 6);

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/welcomebg.png')` }}
        >
          <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px]" />
        </div>

        <SectionWrapper className="relative z-10 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                Welcome to {settings?.clientName || 'Your Benefits'}
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                Your comprehensive benefits portal designed to help you make informed decisions about your health, retirement, and financial wellbeing.
              </p>
              {enrollment?.benefitsGuideUrl ? (
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-14 px-8 text-lg font-semibold shadow-lg shadow-blue-500/10">
                  <a href={enrollment.benefitsGuideUrl} download>
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
              {enrollment?.videoUrl ? (
                <iframe
                  src={getEmbedUrl(enrollment.videoUrl)!}
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

      {/* Retirement Planning Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url('/images/retirement.png')` }}
        >
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]" />
        </div>

        <SectionWrapper className="relative z-10 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="h-80 md:h-96 rounded-2xl bg-white/40 backdrop-blur-md border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-xl">
                {retirement?.heroVideoUrl ? (
                  <iframe
                    src={getEmbedUrl(retirement.heroVideoUrl)!}
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
                {retirement?.heroTitle || 'Plan for Your Future'}
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
                {typeof retirement?.heroDescription === 'string'
                  ? retirement.heroDescription
                  : 'Learn about retirement plans, investment options, and strategies to help you achieve your long-term financial goals.'}
              </p>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-14 px-10 text-lg font-semibold shadow-lg shadow-blue-500/10">
                <Link href="/retirement-planning">Learn More</Link>
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
          {previewChapters.map((chapter: BenefitChapterData) => (
            <BenefitCard key={chapter._id} chapter={chapter} />
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Link href="/benefits">View All Benefits</Link>
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
              <p className="text-slate-600 mb-6 leading-relaxed">{item.description}</p>
              <Link
                href={item.title.toLowerCase().includes('contact') ? '/contacts' : (item.href || '#')}
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

// ── Directory Page (no employer context) ──

function DirectoryPage() {
  const slugs = listEmployers();
  const clients = slugs.map((slug) => {
    try {
      const content = getPublishedContent(slug);
      return {
        slug: content.client.slug,
        name: content.client.name,
        themeColor: content.client.themeColor,
        description: content.siteSettings?.footerAbout,
      };
    } catch {
      return { slug, name: slug, themeColor: undefined, description: undefined };
    }
  });

  const getClientIcon = (slug: string) => {
    if (slug === 'abc-corp') return Building2;
    if (slug === 'rs-h') return Building;
    if (slug === 'premier-america') return Globe;
    if (slug === 'global-tech') return Globe;
    return LayoutGrid;
  };

  const getClientTheme = (slug: string) => {
    const themes: Record<string, { bg: string; hover: string }> = {
      'rs-h': { bg: 'bg-blue-600', hover: 'hover:bg-blue-700' },
      'premier-america': { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
      'abc-corp': { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
      'global-tech': { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700' },
    };
    return themes[slug] || { bg: 'bg-blue-600', hover: 'hover:bg-blue-700' };
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] w-[40%] h-[50%] bg-indigo-50/50 rounded-full blur-[100px]" />
      </div>

      <SectionWrapper className="relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold uppercase tracking-widest mb-6 shadow-sm">
            Enterprise Directory
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight drop-shadow-sm">
            Benefits Portal Directory
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Securely access your personalized employee benefits, retirement planning, and corporate resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {clients.map((client: any) => {
            const Icon = getClientIcon(client.slug);
            const theme = getClientTheme(client.slug);

            return (
              <Card
                key={client.slug}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out rounded-[2.5rem]"
              >
                <div className="p-10 flex flex-col items-center text-center">
                  <div className={`${theme.bg} p-6 rounded-3xl text-white mb-8 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
                    {client.name}
                  </h2>
                  <p className="text-slate-500 mb-10 min-h-[4rem] leading-relaxed font-medium px-4">
                    {client.description || 'Employee benefits and insurance management portal.'}
                  </p>
                  <Button
                    asChild
                    className={`w-full h-16 ${theme.bg} ${theme.hover} text-white text-lg font-bold rounded-2xl shadow-lg transition-all duration-300 active:scale-95 border-0`}
                  >
                    <Link href={`/?employer=${client.slug}`}>
                      Enter Portal
                    </Link>
                  </Button>
                  <div className={`absolute bottom-0 left-0 w-full h-1.5 ${theme.bg} transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-20`} />
                </div>
              </Card>
            );
          })}
        </div>
      </SectionWrapper>
    </div>
  );
}
