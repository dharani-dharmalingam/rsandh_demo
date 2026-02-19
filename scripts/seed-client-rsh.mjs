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

async function seedRSH() {
    console.log('🌱 Seeding Full Site for Client: RS&H...');

    const clientRef = { _type: 'reference', _ref: 'client-rsh' };

    try {
        // 1. Create Client Document
        console.log('🏢 Creating Client Document...');
        await client.createOrReplace({
            _id: 'client-rsh',
            _type: 'client',
            name: 'RS&H',
            slug: { _type: 'slug', current: 'rs-h' },
            themeColor: '#0f172a',
        });

        // 2. Site Settings
        console.log('⚙️ Creating Site Settings...');
        await client.createOrReplace({
            _id: 'siteSettings-rsh',
            _type: 'siteSettings',
            client: clientRef,
            clientName: 'RS&H',
            shortName: 'RS',
            logoText: 'RS&H Benefits',
            footerAbout: 'Comprehensive benefits administration and support for the valued employees of RS&H.',
            contactInfo: [
                { _key: 'c1', type: 'email', value: 'benefits@rsandh.com', label: 'Email' },
                { _key: 'c2', type: 'phone', value: '1-800-RSANDH', label: 'Support' }
            ],
            copyrightText: `© ${new Date().getFullYear()} RS&H. All rights reserved.`
        });

        // 3. Chapters (from seed-sanity.mjs)
        console.log('📚 Creating Chapters for RS&H...');
        const chapters = [
            { id: 'ch-1', title: 'Medical Plan', slug: 'medical', icon: 'heart' },
            { id: 'ch-2', title: 'Dental Plan', slug: 'dental', icon: 'smile' }
        ];

        for (const ch of chapters) {
            await client.createOrReplace({
                _id: `rsh-${ch.id}`,
                _type: 'benefitChapter',
                client: clientRef,
                title: ch.title,
                slug: { _type: 'slug', current: ch.slug },
                description: `Benefits information for ${ch.title}.`,
                icon: ch.icon,
                order: 1
            });
        }

        // 4. Enrollment Settings
        console.log('📅 Creating Enrollment Settings for RS&H...');
        await client.createOrReplace({
            _id: 'openEnrollment-rsh',
            _type: 'openEnrollment',
            client: clientRef,
            title: 'Welcome to RS&H Open Enrollment',
            description: 'Your window to review and select your 2026 benefit options.',
            startDate: '2026-04-01T00:00:00Z',
            endDate: '2026-04-30T23:59:59Z',
            daysLeftLabel: 'Days Left',
            periodLabel: 'Enrollment Period',
            statusTitle: 'Action Required',
            statusDescription: 'Please finalize your elections before April 30th',
            checklistLabel: 'Enrollment Steps',
            checklistSubtext: 'Guide to completing your enrollment',
            changesLabel: '2026 Plan Updates',
            changesSubtext: 'What you need to know for the new year',
            enrollLabel: 'Enroll Online',
            enrollSubtext: 'Submit your 2026 benefits',
        });

        console.log('✅ Full site for RS&H seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding RS&H data:', error.message);
    }
}

seedRSH();
