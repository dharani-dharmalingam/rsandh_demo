import { headers } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionWrapper } from '@/components/section-wrapper';
import { BenefitCard } from '@/components/benefit-card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { FloatingAssistant } from '@/components/floating-assistant';
import { FileText, HelpCircle, TrendingUp, ArrowRight } from 'lucide-react';
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
      const settings = content.siteSettings;
      const chapters = content.benefitChapters;

      return (
        <>
          <Header
            logoText={settings?.logoText}
            clientName={settings?.clientName}
            shortName={settings?.shortName}
            clientLogo={settings?.clientLogo}
            chapters={chapters}
          />
          <main className="min-h-screen">
            <EmployerHomePage content={content} />
          </main>
          <Footer
            clientName={settings?.clientName}
            about={settings?.footerAbout}
            quickLinks={settings?.quickLinks}
            contactInfo={settings?.contactInfo}
            copyrightText={settings?.copyrightText}
            footerContactTitle={settings?.footerContactTitle}
            footerContactDescription={settings?.footerContactDescription}
          />
          <FloatingAssistant />
        </>
      );
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
      };
    } catch {
      return { slug, name: slug, themeColor: undefined };
    }
  });

  const getThemeStyles = (slug: string) => {
    const themes: Record<string, { gradient: string; hover: string; ring: string }> = {
      'rs-h': { gradient: 'from-slate-800 to-slate-700', hover: 'hover:from-slate-700 hover:to-slate-600', ring: 'focus-visible:ring-slate-400' },
      'premier-america': { gradient: 'from-emerald-700 to-emerald-600', hover: 'hover:from-emerald-600 hover:to-emerald-500', ring: 'focus-visible:ring-emerald-400' },
      'lehr': { gradient: 'from-blue-700 to-blue-600', hover: 'hover:from-blue-600 hover:to-blue-500', ring: 'focus-visible:ring-blue-400' },
      'abc-corp': { gradient: 'from-emerald-700 to-emerald-600', hover: 'hover:from-emerald-600 hover:to-emerald-500', ring: 'focus-visible:ring-emerald-400' },
      'global-tech': { gradient: 'from-indigo-700 to-indigo-600', hover: 'hover:from-indigo-600 hover:to-indigo-500', ring: 'focus-visible:ring-indigo-400' },
    };
    return themes[slug] || { gradient: 'from-slate-800 to-slate-700', hover: 'hover:from-slate-700 hover:to-slate-600', ring: 'focus-visible:ring-slate-400' };
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
      </div>

      <SectionWrapper className="relative z-10">
        <div className="text-center mb-14 opacity-0 animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold uppercase tracking-widest mb-6 shadow-sm">
            Enterprise Directory
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">
            Benefits Portal Directory
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto text-base">
            Select your organization to access your benefits portal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {clients.map((client: any, index: number) => {
            const theme = getThemeStyles(client.slug);
            return (
              <Link
                key={client.slug}
                href={`/?employer=${client.slug}`}
                className="block opacity-0 animate-fade-up focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 rounded-2xl"
                style={{ animationDelay: `${120 + index * 80}ms`, animationFillMode: 'forwards' }}
              >
                <div
                  className={`
                    group relative overflow-hidden
                    bg-white/60 backdrop-blur-xl rounded-2xl
                    border border-white/60
                    shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/50
                    px-8 py-10
                    transition-all duration-300 ease-out
                    hover:-translate-y-1 hover:scale-[1.02]
                    hover:bg-white/80
                    active:scale-[0.99]
                  `}
                >
                  <div className="flex flex-col items-center justify-center min-h-[100px] gap-2">
                    <span className="text-2xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                      {client.name}
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient} ${theme.hover} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-b-2xl`}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </SectionWrapper>
    </div>
  );
}
