import { sanityFetch } from '@/sanity/lib/live';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { SectionWrapper } from '@/components/section-wrapper';
import { Card } from '@/components/ui/card';
import { Phone, Mail, Globe, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ContactsPage({ params }: { params: Promise<{ clientSlug: string }> }) {
    const { clientSlug } = await params;
    const { data: settings } = await sanityFetch({
        query: siteSettingsQuery,
        params: { clientSlug }
    });

    const contacts = settings?.contactInfo || [];

    function getContactIcon(href?: string) {
        if (!href) return <Phone className="h-6 w-6 text-slate-400" />;
        if (href.startsWith('mailto:')) return <Mail className="h-6 w-6 text-blue-500" />;
        if (href.startsWith('http')) return <Globe className="h-6 w-6 text-emerald-500" />;
        if (href.startsWith('tel:')) return <Phone className="h-6 w-6 text-slate-400" />;
        return <Phone className="h-6 w-6 text-slate-400" />;
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <SectionWrapper className="py-6">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="rounded-full">
                            <Link href={`/${clientSlug}`}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Important Contact Information</h1>
                            <p className="text-slate-600 text-sm">Access support, billing, and general inquiries</p>
                        </div>
                    </div>
                </SectionWrapper>
            </div>

            <SectionWrapper className="mt-12">
                <div className="max-w-4xl mx-auto">
                    {contacts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {contacts.map((contact: any, idx: number) => (
                                <Card key={contact._key || idx} className="p-8 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="p-4 bg-slate-100 rounded-2xl shrink-0 self-start md:self-center">
                                            {getContactIcon(contact.href)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-bold text-slate-900 mb-1">{contact.label}</h2>
                                            <p className="text-slate-600 mb-4">{contact.description || 'Benefit provider or support contact'}</p>

                                            {contact.href ? (
                                                <a
                                                    href={contact.href}
                                                    className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all block"
                                                    target={contact.href.startsWith('http') ? '_blank' : undefined}
                                                    rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                >
                                                    {contact.value}
                                                </a>
                                            ) : (
                                                <span className="text-lg font-semibold text-slate-900 break-all block">
                                                    {contact.value}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex md:flex-col gap-3 shrink-0">
                                            {contact.href?.startsWith('tel:') && (
                                                <Button asChild variant="outline" className="flex-1 md:flex-none">
                                                    <a href={contact.href}>Call Now</a>
                                                </Button>
                                            )}
                                            {contact.href?.startsWith('mailto:') && (
                                                <Button asChild variant="outline" className="flex-1 md:flex-none">
                                                    <a href={contact.href}>Send Email</a>
                                                </Button>
                                            )}
                                            {contact.href?.startsWith('http') && (
                                                <Button asChild variant="outline" className="flex-1 md:flex-none">
                                                    <a href={contact.href} target="_blank" rel="noopener noreferrer">Visit Website</a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                            <Phone className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No contacts found</h3>
                            <p className="text-slate-500">Important contacts will appear here once they are added in Sanity.</p>
                        </div>
                    )}

                    {/* HR Support Card */}
                    <Card className="mt-12 p-8 bg-blue-600 text-white border-0 overflow-hidden relative">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold mb-2">Need more help?</h3>
                                <p className="text-blue-100 max-w-md">Our HR support team is available Monday through Friday, 8:00 AM to 5:00 PM EST to assist you with any benefits questions.</p>
                            </div>
                            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold shrink-0">
                                <a href={`mailto:hr@${clientSlug}.com`}>Contact HR Support</a>
                            </Button>
                        </div>
                        {/* Subtle Background Pattern */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    </Card>
                </div>
            </SectionWrapper>
        </div>
    );
}
