import React from 'react';
import { PortableText as BasePortableText, type PortableTextComponents } from '@portabletext/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const components: PortableTextComponents = {
    types: {
        tabs: ({ value }) => {
            const items = value.items || [];
            if (items.length === 0) return null;

            return (
                <div className="my-10">
                    <Tabs defaultValue={items[0]._key} className="w-full">
                        <div className="overflow-x-auto pb-2 mb-6">
                            <TabsList className="bg-slate-100/80 p-1 rounded-xl inline-flex min-w-full sm:min-w-0">
                                {items.map((item: any) => (
                                    <TabsTrigger
                                        key={item._key}
                                        value={item._key}
                                        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
                                    >
                                        {item.title}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        {items.map((item: any) => (
                            <TabsContent key={item._key} value={item._key} className="mt-0 focus-visible:ring-0">
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between gap-8">
                                        <div className="flex-1">
                                            <div className="prose prose-slate max-w-none">
                                                <BasePortableText value={item.content} components={components} />
                                            </div>
                                        </div>
                                        {item.link && (
                                            <div className="md:w-64 shrink-0">
                                                <div className="sticky top-6 rounded-xl bg-blue-50 p-6 border border-blue-100">
                                                    <h4 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wider">Plan Actions</h4>
                                                    <p className="text-xs text-blue-700 mb-4 leading-relaxed">
                                                        Ready to enroll or need a personalized quote? Visit the provider portal below.
                                                    </p>
                                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                                                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                            {item.linkLabel || 'Get a Quote'}
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            );
        },
    },
    block: {
        h1: ({ children }) => <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-bold text-slate-800 mt-6 mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-semibold text-slate-800 mt-4 mb-2">{children}</h3>,
        h4: ({ children }) => <h4 className="text-lg font-semibold text-slate-800 mt-3 mb-1">{children}</h4>,
        normal: ({ children }) => <p className="text-base text-slate-600 leading-relaxed mb-4">{children}</p>,
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-700 my-6">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }) => (
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm my-6">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</ul>
            </div>
        ),
        number: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-slate-600">{children}</ol>,
    },
    listItem: {
        bullet: ({ children }) => (
            <li className="flex items-start gap-3 rounded-lg bg-white px-4 py-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">✓</span>
                <span className="text-sm text-slate-700">{children}</span>
            </li>
        ),
        number: ({ children }) => <li>{children}</li>,
    },
    marks: {
        strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        link: ({ children, value }) => {
            const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined;
            return (
                <a
                    href={value.href}
                    rel={rel}
                    className="text-blue-600 underline hover:text-blue-700 transition-colors"
                >
                    {children}
                </a>
            );
        },
    },
};

interface PortableTextProps {
    value: any;
    className?: string;
}

export function PortableText({ value, className }: PortableTextProps) {
    if (!value) return null;

    return (
        <div className={cn("prose prose-slate max-w-none", className)}>
            <BasePortableText value={value} components={components} />
        </div>
    );
}
