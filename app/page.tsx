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

    // Robust theme mapping to avoid black/dark colors and provide modern vibrancy
    const getClientTheme = (slug: string) => {
        const themes: Record<string, { bg: string, text: string, hover: string, glow: string }> = {
            'rs-h': {
                bg: 'bg-blue-600',
                text: 'text-blue-600',
                hover: 'hover:bg-blue-700',
                glow: 'shadow-blue-500/20'
            },
            'abc-corp': {
                bg: 'bg-emerald-600',
                text: 'text-emerald-600',
                hover: 'hover:bg-emerald-700',
                glow: 'shadow-emerald-500/20'
            },
            'global-tech': {
                bg: 'bg-indigo-600',
                text: 'text-indigo-600',
                hover: 'hover:bg-indigo-700',
                glow: 'shadow-indigo-500/20'
            },
        };

        // Default to a vibrant blue if no specific theme exists, avoiding slate/black
        return themes[slug] || {
            bg: 'bg-blue-600',
            text: 'text-blue-600',
            hover: 'hover:bg-blue-700',
            glow: 'shadow-blue-500/20'
        };
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Aesthetic Elements */}
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
                                className={`group relative overflow-hidden bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm hover:shadow-2xl hover:${theme.glow} hover:-translate-y-2 transition-all duration-500 ease-out rounded-[2.5rem]`}
                            >
                                <div className="p-10 flex flex-col items-center text-center">
                                    <div className={`${theme.bg} p-6 rounded-3xl text-white mb-8 shadow-xl shadow-opacity-30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                        <Icon className="h-10 w-10" />
                                    </div>
                                    <h2 className={`text-3xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm group-hover:${theme.text} transition-colors duration-300`}>
                                        {client.name}
                                    </h2>
                                    <p className="text-slate-500 mb-10 min-h-[4rem] leading-relaxed font-medium px-4">
                                        {client.description || 'Employee benefits and insurance management portal.'}
                                    </p>
                                    <Button
                                        asChild
                                        className={`w-full h-16 ${theme.bg} ${theme.hover} text-white text-lg font-bold rounded-2xl shadow-lg transition-all duration-300 active:scale-95 border-0`}
                                    >
                                        <Link href={`/${client.slug}`}>
                                            Enter Portal
                                        </Link>
                                    </Button>

                                    {/* Bottom aesthetic bar */}
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
