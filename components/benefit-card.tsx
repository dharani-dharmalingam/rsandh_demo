import Link from 'next/link';
import { urlFor } from '@/sanity/lib/image';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface SanityBenefitChapter {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  icon?: string;
  image?: any;
}

interface BenefitCardProps {
  chapter: SanityBenefitChapter;
}

export function BenefitCard({ chapter }: BenefitCardProps) {
  const imageUrl = chapter.image
    ? urlFor(chapter.image).width(400).height(300).url()
    : null;

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={chapter.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
            No image
          </div>
        )}
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
