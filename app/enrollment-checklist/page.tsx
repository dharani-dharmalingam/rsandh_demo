import { SectionWrapper } from '@/components/section-wrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2 } from 'lucide-react';
import { sanityFetch } from '@/sanity/lib/live';
import { enrollmentChecklistQuery } from '@/sanity/lib/queries';

export const metadata = {
  title: 'Enrollment Checklist - RS&H Benefits Portal',
  description: 'Step-by-step checklist for benefits enrollment',
};

type ChecklistItem = {
  _key: string;
  step: number;
  title: string;
  description: string;
};

type ChecklistPageData = {
  title: string;
  description: string;
  items: ChecklistItem[];
  ctaTitle: string;
  ctaDescription: string;
};

export default async function EnrollmentChecklistPage() {
  const { data } = await sanityFetch({ query: enrollmentChecklistQuery });
  const typedData = data as ChecklistPageData | null;

  const items = typedData?.items || [];

  return (
    <div className="space-y-0">
      {/* Hero */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          {typedData?.title || 'Enrollment Checklist'}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          {typedData?.description ||
            'Use this step-by-step checklist to prepare for open enrollment and make informed decisions about your benefits.'}
        </p>
      </SectionWrapper>

      {/* Checklist */}
      <SectionWrapper className="bg-white">
        <div className="max-w-3xl">
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item._key}
                  className="flex gap-4 p-6 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <Checkbox id={`item-${item.step}`} className="mt-1" />
                  <div className="flex-1">
                    <label htmlFor={`item-${item.step}`} className="cursor-pointer flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                          Step {item.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No checklist items available yet. Check back soon.</p>
          )}

          {/* Next Steps */}
          <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">
                  {typedData?.ctaTitle || 'Ready to Enroll?'}
                </h3>
                <p className="text-sm text-green-800 mb-4">
                  {typedData?.ctaDescription ||
                    "Once you've completed this checklist, you're ready to make your benefit elections during open enrollment."}
                </p>
                <Button className="bg-green-600 hover:bg-green-700">Complete Enrollment</Button>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Help Section */}
      <SectionWrapper className="bg-slate-50">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Need Help?</h2>

          <div className="space-y-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Questions about plans?</strong> Our Benefits Assistant can help answer questions about coverage
                options.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Need one-on-one guidance?</strong> Contact HR to schedule a benefits counseling session.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Provider networks?</strong> Check the plan details to verify your preferred providers are
                covered.
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
