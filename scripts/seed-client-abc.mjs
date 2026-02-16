import { createClient } from '@sanity/client';
import fs from 'fs';

// Load .env.local if it exists
if (fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
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

async function seedABC() {
    console.log('🌱 Seeding Full Site for Client: ABC...');

    const clientSlug = 'abc-corp';
    const clientRef = { _type: 'reference', _ref: 'client-abc' };

    try {
        // 1. Create Client Document
        console.log('🏢 Creating Client Document...');
        await client.createOrReplace({
            _id: 'client-abc',
            _type: 'client',
            name: 'ABC Corp',
            slug: { _type: 'slug', current: clientSlug },
            themeColor: '#2563eb',
        });

        // 2. Site Settings
        console.log('⚙️ Creating Site Settings...');
        await client.createOrReplace({
            _id: 'siteSettings-abc',
            _type: 'siteSettings',
            client: clientRef,
            clientName: 'ABC Corp',
            shortName: 'ABC',
            logoText: 'ABC Benefits Hub',
            footerAbout: 'Your trusted partner for comprehensive employee benefits, healthcare, and retirement planning at ABC Corp.',
            contactInfo: [
                { _key: 'c1', type: 'email', value: 'benefits@abccorp.com', label: 'Email' },
                { _key: 'c2', type: 'phone', value: '1-800-ABC-CORP', label: 'Support' }
            ],
            copyrightText: `© ${new Date().getFullYear()} ABC Corp. All rights reserved.`
        });

        // 3. Chapters
        console.log('📚 Creating Chapters for ABC...');
        const abcChapters = [
            { id: 'abc-ch-1', title: 'ABC Health Plan', slug: 'abc-health', icon: 'heart' },
            { id: 'abc-ch-2', title: 'Life at ABC', slug: 'life-at-abc', icon: 'smile' }
        ];

        for (const ch of abcChapters) {
            await client.createOrReplace({
                _id: ch.id,
                _type: 'benefitChapter',
                client: clientRef,
                title: ch.title,
                slug: { _type: 'slug', current: ch.slug },
                description: `Exclusive ${ch.title} details for ABC Corp employees.`,
                icon: ch.icon,
                order: 1
            });
        }

        // 4. Hero / Enrollment
        console.log('📅 Creating Enrollment Settings...');
        await client.createOrReplace({
            _id: 'openEnrollment-abc',
            _type: 'openEnrollment',
            client: clientRef,
            title: 'ABC Annual Enrollment 2026',
            description: 'Time to choose your benefits for the upcoming year at ABC Corp.',
            startDate: '2026-03-01T00:00:00Z',
            endDate: '2026-03-31T23:59:59Z',
        });

        console.log('✅ Full site for ABC Corp seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding ABC data:', error.message);
    }
}

seedABC();
