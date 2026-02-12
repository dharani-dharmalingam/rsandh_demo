import { SectionWrapper } from '@/components/section-wrapper';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';
import { sanityFetch } from '@/sanity/lib/live';
import { retirementPlanningQuery } from '@/sanity/lib/queries';

export const metadata = {
  title: 'Retirement Planning - RS&H Benefits Portal',
  description: 'Resources and tools for planning your retirement',
};

type RetirementFeature = {
  _key: string;
  iconName: string;
  title: string;
  description: string;
};

type RetirementSection = {
  _key: string;
  title: string;
  content: string;
};

type RetirementPageData = {
  heroTitle: string;
  heroDescription: string;
  featuresTitle: string;
  features: RetirementFeature[];
  planningTitle: string;
  sections: RetirementSection[];
  ctaButtonText: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  'target': Target,
  'bar-chart-3': BarChart3,
};

function getIcon(iconName?: string) {
  if (!iconName) return TrendingUp;
  return iconMap[iconName] || TrendingUp;
}

export default async function RetirementPlanningPage() {
  const { data } = await sanityFetch({ query: retirementPlanningQuery });
  const typedData = data as RetirementPageData | null;

  const features = typedData?.features || [];
  const sections = typedData?.sections || [];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {typedData?.heroTitle || 'Retirement Planning'}
            </h1>
            <p className="text-lg text-slate-600 mb-4">
              {typedData?.heroDescription ||
                "Plan your future with confidence. RS&H offers comprehensive retirement benefits and planning resources to help you achieve your long-term financial goals."}
            </p>
          </div>
          <div className="h-96 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-6xl mb-2">▶</div>
              <p>Video Placeholder</p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Key Features */}
      <SectionWrapper className="bg-white">
        <h2 className="text-3xl font-bold text-slate-900 mb-12">
          {typedData?.featuresTitle || 'Retirement Benefits'}
        </h2>

        {features.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const IconComponent = getIcon(feature.iconName);
              return (
                <div key={feature._key} className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow">
                  <IconComponent className="h-10 w-10 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow">
              <TrendingUp className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">401(k) Plan</h3>
              <p className="text-sm text-slate-600">
                Save for retirement with employer matching contributions and investment options.
              </p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow">
              <DollarSign className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Pension Plan</h3>
              <p className="text-sm text-slate-600">
                Defined benefit pension plan for eligible employees with competitive retirement benefits.
              </p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow">
              <Target className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Financial Planning</h3>
              <p className="text-sm text-slate-600">
                Access free financial planning tools and resources to plan your retirement strategy.
              </p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow">
              <BarChart3 className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Retirement Counseling</h3>
              <p className="text-sm text-slate-600">
                Work with professional advisors to develop a personalized retirement plan.
              </p>
            </div>
          </div>
        )}
      </SectionWrapper>

      {/* Detailed Content */}
      <SectionWrapper className="bg-slate-50">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {typedData?.planningTitle || 'Planning Your Retirement'}
          </h2>

          {sections.length > 0 ? (
            <div className="space-y-6 text-slate-700">
              {sections.map((section) => (
                <div key={section._key}>
                  <h3 className="font-semibold text-slate-900 mb-2">{section.title}</h3>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Start Early, Save Often</h3>
                <p>
                  The earlier you start saving for retirement, the more time your investments have to grow. RS&H&apos;s
                  retirement plans offer multiple investment options to suit your risk tolerance and timeline.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Maximize Employer Matching</h3>
                <p>
                  Take full advantage of RS&H&apos;s 401(k) matching program. This is free money for your retirement that
                  helps you build a stronger financial foundation.
                </p>
              </div>
            </div>
          )}

          <Button className="mt-8 bg-blue-600 hover:bg-blue-700">
            {typedData?.ctaButtonText || 'Schedule a Consultation'}
          </Button>
        </div>
      </SectionWrapper>
    </div>
  );
}
