import { createClient } from '@sanity/client';
import fs from 'fs';

// Load .env.local if it exists
if (fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ow03d9eg',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-02-11',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
});

const clientsData = [
    {
        id: 'client-abc',
        name: 'ABC Corp',
        slug: 'abc-corp',
        themeColor: '#2563eb',
        shortName: 'ABC',
        logoText: 'ABC Benefits Hub',
        footerAbout: 'Your trusted partner for comprehensive employee benefits, healthcare, and retirement planning at ABC Corp.',
        email: 'benefits@abccorp.com',
        phone: '1-800-ABC-CORP',
        enrollmentTitle: 'ABC Annual Enrollment 2026',
        enrollmentDesc: 'Time to choose your benefits for the upcoming year at ABC Corp.',
        plans: [
            { id: 'abc-ch-1', title: 'ABC Health Plan', slug: 'abc-health', icon: 'heart', desc: 'Comprehensive medical coverage for ABC employees.' },
            { id: 'abc-ch-2', title: 'Life at ABC', slug: 'life-at-abc', icon: 'smile', desc: 'Wellness and life balance programs.' },
            { id: 'abc-ch-3', title: 'ABC Dental & Vision', slug: 'abc-dental-vision', icon: 'eye', desc: 'Coverage for your dental and vision needs.' }
        ]
    },
    {
        id: 'client-rsh',
        name: 'RS&H',
        slug: 'rs-h',
        themeColor: '#0f172a',
        shortName: 'RS',
        logoText: 'RS&H Benefits',
        footerAbout: 'Comprehensive benefits administration and support for the valued employees of RS&H.',
        email: 'benefits@rsandh.com',
        phone: '1-800-RSANDH',
        enrollmentTitle: 'RS&H Open Enrollment 2026',
        enrollmentDesc: 'Review and update your benefit elections for 2026.',
        plans: [
            { id: 'rsh-ch-1', title: 'Medical Plan', slug: 'medical', icon: 'heart', desc: 'BCBS PPO and HDHP options.' },
            { id: 'rsh-ch-2', title: 'Dental & Vision', slug: 'dental-vision', icon: 'smile', desc: 'Delta Dental and VSP Vision coverage.' },
            { id: 'rsh-ch-3', title: 'Income Protection', slug: 'income-protection', icon: 'shield', desc: 'Short and long term disability coverage.' }
        ]
    },
    {
        id: 'client-global-tech',
        name: 'Global Tech',
        slug: 'global-tech',
        themeColor: '#10b981',
        shortName: 'GT',
        logoText: 'Global Tech Hub',
        footerAbout: 'Innovating for the future, Global Tech provides top-tier benefits for our global workforce.',
        email: 'hr-benefits@globaltech.io',
        phone: '1-888-GT-BENEFITS',
        enrollmentTitle: 'Global Tech Benefits Season 2026',
        enrollmentDesc: 'Explore the next level of benefits for the Global Tech team.',
        plans: [
            { id: 'gt-ch-1', title: 'Global Health Explorer', slug: 'health-explorer', icon: 'globe', desc: 'International medical coverage for global citizens.' },
            { id: 'gt-ch-2', title: 'Tech Wellness Pro', slug: 'tech-wellness', icon: 'zap', desc: 'Mental health and ergonomic support for innovators.' },
            { id: 'gt-ch-3', title: 'Future Secure', slug: 'future-secure', icon: 'lock', desc: 'Comprehensive life and identity protection.' }
        ]
    }
];

async function seedAll() {
    console.log('🌱 Starting Comprehensive Seeding for All Clients...\n');

    for (const c of clientsData) {
        console.log(`--- Seeding Client: ${c.name} ---`);
        const clientRef = { _type: 'reference', _ref: c.id };

        try {
            // 1. Client Document
            await client.createOrReplace({
                _id: c.id,
                _type: 'client',
                name: c.name,
                slug: { _type: 'slug', current: c.slug },
                themeColor: c.themeColor,
            });

            // 2. Site Settings
            await client.createOrReplace({
                _id: `siteSettings-${c.slug}`,
                _type: 'siteSettings',
                client: clientRef,
                clientName: c.name,
                shortName: c.shortName,
                logoText: c.logoText,
                footerAbout: c.footerAbout,
                contactInfo: [
                    { _key: 'c1', type: 'email', value: c.email, label: 'Email' },
                    { _key: 'c2', type: 'phone', value: c.phone, label: 'Support' }
                ],
                copyrightText: `© ${new Date().getFullYear()} ${c.name}. All rights reserved.`
            });

            // 3. Open Enrollment
            await client.createOrReplace({
                _id: `openEnrollment-${c.slug}`,
                _type: 'openEnrollment',
                client: clientRef,
                title: c.enrollmentTitle,
                description: c.enrollmentDesc,
                startDate: '2026-03-01T00:00:00Z',
                endDate: '2026-03-31T23:59:59Z',
            });

            // 4. Benefits Page
            await client.createOrReplace({
                _id: `benefitsPage-${c.slug}`,
                _type: 'benefitsPage',
                client: clientRef,
                title: `Welcome to ${c.name} Benefits`,
                description: `Explore the complete range of benefits available to ${c.name} employees.`,
            });

            // 5. Benefit Changes Page
            await client.createOrReplace({
                _id: `benefitChangesPage-${c.slug}`,
                _type: 'benefitChangesPage',
                client: clientRef,
                title: `What's New at ${c.name} for 2026`,
                description: 'We are constantly improving our benefits to support you better.',
                alertMessage: 'Changes take effect on April 1, 2026.',
                changes: [
                    { _key: 'ch1', type: 'new', title: 'Remote Work Stipend', description: 'Monthly allowance for home office expenses.' },
                    { _key: 'ch2', type: 'update', title: 'Increased 401(k) Match', description: 'Company match increased to 6%.' }
                ],
                ctaTitle: 'Review Changes Today',
                ctaDescription: 'Make sure you understand how these changes affect your bottom line.'
            });

            // 6. Enrollment Checklist
            await client.createOrReplace({
                _id: `checklist-${c.slug}`,
                _type: 'enrollmentChecklist',
                client: clientRef,
                title: 'Your Enrollment Roadmap',
                description: 'Follow these steps to ensure a smooth enrollment process.',
                items: [
                    { _key: 's1', step: 1, title: 'Check Profile', description: 'Verify your personal details in the portal.' },
                    { _key: 's2', step: 2, title: 'Select Plans', description: 'Choose the medical and dental plans that fit your needs.' },
                    { _key: 's3', step: 3, title: 'Add Beneficiaries', description: 'Update your life insurance beneficiaries.' }
                ],
                ctaTitle: 'Ready to Begin?',
                ctaDescription: 'The enrollment portal is now open.'
            });

            // 7. Retirement Planning
            await client.createOrReplace({
                _id: `retirement-${c.slug}`,
                _type: 'retirementPlanning',
                client: clientRef,
                heroTitle: 'Secure Your Future',
                heroDescription: `${c.name} offers tools to help you build a lasting legacy.`,
                featuresTitle: 'Retirement Perks',
                features: [
                    { _key: 'f1', iconName: 'trending-up', title: 'Dynamic 401(k)', description: 'Multiple investment funds to choose from.' },
                    { _key: 'f2', iconName: 'dollar-sign', title: 'Profit Sharing', description: 'Annual contributions based on company performance.' }
                ],
                planningTitle: 'Plan with Confidence',
                sections: [
                    { _key: 'sec1', title: 'Financial Workshops', content: 'Join our monthly webinars on financial management.' },
                    { _key: 'sec2', title: '1-on-1 Advising', content: 'Book a session with a certified financial planner.' }
                ],
                ctaButtonText: 'View Retirement Portal'
            });

            // 8. Benefit Chapters (Plans)
            for (const p of c.plans) {
                await client.createOrReplace({
                    _id: p.id,
                    _type: 'benefitChapter',
                    client: clientRef,
                    title: p.title,
                    slug: { _type: 'slug', current: p.slug },
                    description: p.desc,
                    icon: p.icon,
                    order: 1,
                    content: [
                        {
                            _type: 'block',
                            _key: 'b1',
                            style: 'normal',
                            children: [{ _type: 'span', _key: 's1', text: `This plan provides ${p.desc}` }]
                        }
                    ]
                });
            }

            console.log(`✅ ${c.name} seeded successfully.`);
        } catch (err) {
            console.error(`❌ Error seeding ${c.name}:`, err.message);
        }
    }

    console.log('\n🏁 Seeding Complete!');
}

seedAll();
