'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Phone, Mail, Globe, ChevronDown, ChevronUp } from 'lucide-react';

type ContactInfo = {
    _key?: string;
    label: string;
    value: string;
    href?: string;
};

interface ImportantContactsProps {
    contacts: ContactInfo[];
}

function getContactIcon(href?: string) {
    if (!href) return <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />;
    if (href.startsWith('mailto:')) return <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    if (href.startsWith('http')) return <Globe className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
    return <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />;
}

export function ImportantContacts({ contacts }: ImportantContactsProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!contacts || contacts.length === 0) return null;

    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-2">Important Contacts</h3>
            <p className="text-sm text-slate-600 mb-4">Find phone numbers, policy numbers and email addresses</p>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors cursor-pointer"
            >
                {isOpen ? 'Hide Contacts' : 'View Contacts'}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {isOpen && (
                <div className="mt-4 border-t border-slate-100 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {contacts.map((contact, index) => (
                        <div
                            key={contact._key || index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors"
                        >
                            <div className="mt-0.5">
                                {getContactIcon(contact.href)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800">{contact.label}</p>
                                {contact.href ? (
                                    <a
                                        href={contact.href}
                                        target={contact.href.startsWith('http') ? '_blank' : undefined}
                                        rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                                    >
                                        {contact.value}
                                    </a>
                                ) : (
                                    <p className="text-sm text-slate-600 break-all">{contact.value}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
