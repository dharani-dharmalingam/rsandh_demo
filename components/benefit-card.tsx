import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface BenefitChapter {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  icon?: string;
  image?: string;
}

interface BenefitCardProps {
  chapter: BenefitChapter;
}

const ICON_TO_IMAGE: Record<string, string> = {
  'heart': '/images/benefits/medical.png',
  'shield': '/images/benefits/medical.png',
  'smile': '/images/benefits/dental.png',
  'eye': '/images/benefits/vision.png',
  'check-circle': '/images/benefits/eligibility.png',
  'dollar-sign': '/images/benefits/fsa-hsa.png',
  'trending-up': '/images/benefits/retirement.png',
  'umbrella': '/images/benefits/life-insurance.png',
  'briefcase': '/images/benefits/disability.png',
  'plus-circle': '/images/benefits/supplemental.png',
  'users': '/images/benefits/eap.png',
  'activity': '/images/benefits/wellness.png',
  'list': '/images/benefits/overview.png',
  'calendar': '/images/benefits/eligibility.png',
  'gift': '/images/benefits/supplemental.png',
  'file-text': '/images/benefits/overview.png',
};

const TITLE_KEYWORDS: [RegExp, string][] = [
  [/medical|health|hdhp|hmo|ppo|bcbs/i, '/images/benefits/medical.png'],
  [/dental/i, '/images/benefits/dental.png'],
  [/vision/i, '/images/benefits/vision.png'],
  [/eligibility|enrollment|qualifying/i, '/images/benefits/eligibility.png'],
  [/fsa|hsa|flexible.*spend|health.*savings/i, '/images/benefits/fsa-hsa.png'],
  [/retire|401k|pension/i, '/images/benefits/retirement.png'],
  [/life.*insurance|survivor/i, '/images/benefits/life-insurance.png'],
  [/disability|income.*protect/i, '/images/benefits/disability.png'],
  [/supplement/i, '/images/benefits/supplemental.png'],
  [/eap|assistance|mental.*health/i, '/images/benefits/eap.png'],
  [/wellness|wellbeing/i, '/images/benefits/wellness.png'],
  [/overview|summary|available.*plan/i, '/images/benefits/overview.png'],
];

function getFallbackImage(icon?: string, title?: string): string {
  if (icon && ICON_TO_IMAGE[icon]) return ICON_TO_IMAGE[icon];
  if (title) {
    for (const [pattern, img] of TITLE_KEYWORDS) {
      if (pattern.test(title)) return img;
    }
  }
  return '/images/benefits/overview.png';
}

export function BenefitCard({ chapter }: BenefitCardProps) {
  const imageUrl = chapter.image || getFallbackImage(chapter.icon, chapter.title);

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={chapter.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{chapter.title}</h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{chapter.description}</p>

        <Link href={`/benefits/${chapter.slug}`}>
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            Learn More <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
