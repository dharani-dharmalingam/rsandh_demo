import { SectionWrapper } from '@/components/section-wrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Enrollment Checklist - RS&H Benefits Portal',
  description: 'Step-by-step checklist for benefits enrollment',
};

const checklistItems = [
  {
    step: 1,
    title: 'Review Your Current Coverage',
    description: 'Compare your existing benefits with available plans to understand what has changed.',
  },
  {
    step: 2,
    title: 'Assess Your Healthcare Needs',
    description: 'Consider your medical, dental, and vision needs for the upcoming year.',
  },
  {
    step: 3,
    title: 'Evaluate Plan Options',
    description: 'Review medical, dental, vision, and wellness plan options that best fit your needs.',
  },
  {
    step: 4,
    title: 'Compare Costs',
    description: 'Look at premiums, deductibles, copays, and out-of-pocket maximums for each plan.',
  },
  {
    step: 5,
    title: 'Review Network Providers',
    description: 'Ensure your preferred doctors and providers are in-network for any plan you choose.',
  },
  {
    step: 6,
    title: 'Consider Life Events',
    description: 'Account for any qualifying life events that may affect your coverage needs.',
  },
  {
    step: 7,
    title: 'Explore FSA/HSA Options',
    description: 'Determine if you should contribute to Flexible Spending or Health Savings Accounts.',
  },
  {
    step: 8,
    title: 'Review Supplemental Benefits',
    description: 'Consider optional supplemental insurance like accident, critical illness, or life insurance.',
  },
  {
    step: 9,
    title: 'Confirm Beneficiaries',
    description: 'Update beneficiaries on life insurance and retirement plan accounts as needed.',
  },
  {
    step: 10,
    title: 'Submit Your Elections',
    description: 'Complete your enrollment through the benefits portal before the deadline.',
  },
];

export default function EnrollmentChecklistPage() {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Enrollment Checklist</h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Use this step-by-step checklist to prepare for open enrollment and make informed decisions about your
          benefits.
        </p>
      </SectionWrapper>

      {/* Checklist */}
      <SectionWrapper className="bg-white">
        <div className="max-w-3xl">
          <div className="space-y-4">
            {checklistItems.map((item) => (
              <div
                key={item.step}
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

          {/* Next Steps */}
          <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Ready to Enroll?</h3>
                <p className="text-sm text-green-800 mb-4">
                  Once you've completed this checklist, you're ready to make your benefit elections during open
                  enrollment.
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
