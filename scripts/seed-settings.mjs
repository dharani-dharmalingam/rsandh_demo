import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
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
    token: process.env.SANITY_WRITE_TOKEN,
});

async function seedSettings() {
    console.log('🌱 Seeding Site Settings...');

    const settings = {
        _id: 'siteSettings',
        _type: 'siteSettings',
        logoText: 'RS&H Benefits Hub',
        footerAbout: 'Your trusted partner for comprehensive employee benefits, healthcare, and retirement planning at RS&H.',
        quickLinks: [
            { _key: '1', label: 'Benefits Guide', href: '/' },
            { _key: '2', label: 'Enrollment', href: '/enrollment-checklist' },
            { _key: '3', label: 'Document Hub', href: '/document-hub' },
            { _key: '4', label: 'Support', href: '#' },
        ],
        contactInfo: [
            { _key: '1', label: 'Benefits Phone', value: '(888) 555-1234' },
            { _key: '2', label: 'Benefits Email', value: 'hr-benefits@rsandh.com', href: 'mailto:hr-benefits@rsandh.com' },
            { _key: '3', label: 'HR Portal', value: 'myhr.rsandh.com', href: '#' },
        ],
        copyrightText: `© ${new Date().getFullYear()} RS&H Corporate. All rights reserved.`
    };

    try {
        await client.createOrReplace(settings);
        console.log('✅ Site Settings seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding Site Settings:', error.message);
    }
}

seedSettings();
