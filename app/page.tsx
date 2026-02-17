import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/section-wrapper';
import { Building2, Globe, Building, LayoutGrid } from 'lucide-react';
import { sanityFetch } from '@/sanity/lib/live';
import { allClientsQuery } from '@/sanity/lib/queries';

export default async function RootLandingPage() {
    const { data: clients } = await sanityFetch({ query: allClientsQuery });

    // Function to get icon based on name or slug (fallback logic)
    const getClientIcon = (slug: string) => {
        if (slug === 'abc-corp') return Building2;
        if (slug === 'rs-h') return Building;
        if (slug === 'global-tech') return Globe;
        return LayoutGrid;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <SectionWrapper>
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Benefits Portal Directory
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Select a client portal to view their specific benefits, documents, and enrollment information.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {clients.map((client: any) => {
                        const Icon = getClientIcon(client.slug);
                        const colorClass = client.themeColor || 'bg-slate-600';

                        return (
                            <Card key={client.slug} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200">
                                <div className="p-8 flex flex-col items-center text-center">
                                    <div className={`${colorClass} p-4 rounded-2xl text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-3">{client.name}</h2>
                                    <p className="text-slate-500 mb-8 min-h-[3rem]">
                                        {client.description || 'Employee benefits and information portal.'}
                                    </p>
                                    <Button asChild className={`w-full ${colorClass} hover:opacity-90`}>
                                        <Link href={`/${client.slug}`}>
                                            Enter Portal
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </SectionWrapper>
        </div>
    );
}
