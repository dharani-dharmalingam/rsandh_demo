import { SectionWrapper } from '@/components/section-wrapper';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Plus, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Benefit Changes 2026 - RS&H Benefits Portal',
  description: 'Learn about whats new in 2026 benefits',
};

const changes = [
  {
    type: 'new',
    title: 'Enhanced Wellness Program',
    description: 'New wellness initiatives including on-site health screenings and expanded mental health resources.',
  },
  {
    type: 'new',
    title: 'Telehealth Expansion',
    description: 'Extended telehealth coverage now includes virtual mental health services and specialist consultations.',
  },
  {
    type: 'update',
    title: 'Reduced Medical Deductibles',
    description: 'Selected medical plans now feature lower deductibles for in-network care.',
  },
  {
    type: 'update',
    title: 'Increased HSA Contribution Limits',
    description: 'HSA contribution limits have increased for 2026 to help you save more for healthcare expenses.',
  },
  {
    type: 'new',
    title: 'Fertility Benefits',
    description: 'New coverage for fertility treatments and family planning services.',
  },
  {
    type: 'update',
    title: 'Dental Plan Improvements',
    description: 'Enhanced coverage for preventive services and increased annual maximums.',
  },
  {
    type: 'new',
    title: 'Pet Insurance',
    description: 'New optional pet insurance benefit available for employees and their families.',
  },
  {
    type: 'update',
    title: 'Vision Plan Enhancements',
    description: 'Expanded provider networks and improved coverage for specialty lenses.',
  },
];

export default function BenefitChangesPage() {
  const newBenefits = changes.filter((c) => c.type === 'new');
  const updatedBenefits = changes.filter((c) => c.type === 'update');

  return (
    <div className="space-y-0">
      {/* Hero */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">2026 Benefit Changes</h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Discover what's new and improved in RS&H's 2026 benefits package. We've made enhancements to better serve
          you and your family.
        </p>
      </SectionWrapper>

      {/* Alert Banner */}
      <SectionWrapper className="bg-white">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            These changes are effective January 1, 2026. Enroll during open enrollment to take advantage of new
            benefits.
          </AlertDescription>
        </Alert>
      </SectionWrapper>

      {/* New Benefits Section */}
      <SectionWrapper className="bg-white">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Plus className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-slate-900">New Benefits</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newBenefits.map((benefit, index) => (
              <div key={index} className="p-6 border border-green-200 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Updated Benefits Section */}
      <SectionWrapper className="bg-slate-50">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Improved Benefits</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {updatedBenefits.map((benefit, index) => (
              <div key={index} className="p-6 border border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Call to Action */}
      <SectionWrapper className="bg-white">
        <div className="max-w-3xl">
          <div className="p-8 border border-slate-200 rounded-lg bg-gradient-to-br from-blue-50 to-slate-50">
            <div className="flex gap-4 items-start">
              <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Ready to Explore These Changes?</h3>
                <p className="text-slate-600 mb-6">
                  Visit the benefits overview to learn more details about each plan and compare options that work best
                  for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <a href="/benefits">View All Benefits</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/enrollment-checklist">Start Enrollment Checklist</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
