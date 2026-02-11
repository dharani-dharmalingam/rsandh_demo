import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionWrapper } from '@/components/section-wrapper';
import { BenefitCard } from '@/components/benefit-card';
import { BENEFIT_CHAPTERS, OPEN_ENROLLMENT_INFO } from '@/lib/data';
import { FileText, Calendar, HelpCircle, CheckSquare, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const previewChapters = BENEFIT_CHAPTERS.slice(0, 6);

  return (
    <div className="space-y-0">
      {/* Hero Section - Welcome to Company */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Welcome to RS&H
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Your comprehensive benefits portal designed to help you make informed decisions about your health, retirement, and financial wellbeing.
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <a href="/benefits-guide.pdf" download>
                <FileText className="mr-2 h-5 w-5" />
                Download Benefits Guide
              </a>
            </Button>
          </div>
          <div className="h-80 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-6xl mb-2">▶</div>
              <p>Video Placeholder</p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Open Enrollment Section */}
      <SectionWrapper className="bg-white">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{OPEN_ENROLLMENT_INFO.title}</h2>
          <p className="text-slate-600 mb-8">{OPEN_ENROLLMENT_INFO.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Days Left Card */}
          <Card className="p-6 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">Days Left</p>
                <p className="text-4xl font-bold text-blue-900">{OPEN_ENROLLMENT_INFO.daysLeft}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-300" />
            </div>
          </Card>

          {/* Dates Card */}
          <Card className="p-6 border-slate-200">
            <p className="text-sm text-slate-600 font-medium mb-2">Open Enrollment Period</p>
            <p className="text-slate-900 font-medium mb-1">{OPEN_ENROLLMENT_INFO.startDate}</p>
            <p className="text-slate-600 text-sm mb-4">to</p>
            <p className="text-slate-900 font-medium">{OPEN_ENROLLMENT_INFO.endDate}</p>
          </Card>

          {/* Status Card */}
          <Card className="p-6 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <CheckSquare className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-green-600 font-medium">Action Needed</p>
                <p className="text-slate-700 text-sm mt-1">Review and update your selections now</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="h-auto p-4 justify-start flex-col items-start bg-transparent">
            <Link href="/enrollment-checklist">
              <span className="font-semibold text-blue-600">Review Enrollment Checklist</span>
              <span className="text-sm text-slate-600">Prepare for open enrollment</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 justify-start flex-col items-start bg-transparent">
            <Link href="/benefit-changes">
              <span className="font-semibold text-blue-600">Discover Benefit Changes</span>
              <span className="text-sm text-slate-600">What's new for 2026</span>
            </Link>
          </Button>
          <Button asChild className="h-auto p-4 justify-start flex-col items-start bg-blue-600 hover:bg-blue-700">
            <a href="#enroll">
              <span className="font-semibold">Enroll Now</span>
              <span className="text-sm text-blue-100">Complete your enrollment</span>
            </a>
          </Button>
        </div>
      </SectionWrapper>

      {/* Retirement Planning Section */}
      <SectionWrapper className="bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="h-80 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-6xl mb-2">▶</div>
                <p>Video Placeholder</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-blue-600 font-semibold text-sm">Retirement Planning</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Plan for Your Future</h2>
            <p className="text-slate-600 mb-8">
              Learn about retirement plans, investment options, and strategies to help you achieve your long-term financial goals.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/retirement-planning">Learn More</Link>
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* Benefits Grid Section */}
      <SectionWrapper className="bg-white">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Benefits Designed For You</h2>
          <p className="text-slate-600">Explore our comprehensive benefits packages across health, wellness, and retirement.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {previewChapters.map((chapter) => (
            <BenefitCard key={chapter.id} chapter={chapter} />
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Link href="/benefits">View All Benefits</Link>
          </Button>
        </div>
      </SectionWrapper>

      {/* Help Section */}
      <SectionWrapper className="bg-blue-50">
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
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="font-semibold text-slate-900 mb-2">UKG Link</h3>
            <p className="text-sm text-slate-600 mb-4">Access the UKG time and attendance system</p>
            <Link href="#ukg" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Go to UKG →
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="font-semibold text-slate-900 mb-2">Important Contacts</h3>
            <p className="text-sm text-slate-600 mb-4">Find phone numbers and email addresses</p>
            <Link href="/benefits/document-hub" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Contacts →
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="font-semibold text-slate-900 mb-2">Document Hub</h3>
            <p className="text-sm text-slate-600 mb-4">Download benefits documents and guides</p>
            <Link href="/document-hub" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Documents →
            </Link>
          </Card>
        </div>
      </SectionWrapper>
    </div>
  );
}
