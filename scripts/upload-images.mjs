import { createClient } from '@sanity/client';
import https from 'https';
import http from 'http';
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

// Placeholder images from picsum.photos (free, no auth needed)
const chapterImages = [
    { id: 'chapter-document-hub', seed: 'documents', label: 'Document Hub' },
    { id: 'chapter-2026-annual-notice', seed: 'announcement', label: '2026 Annual Notice' },
    { id: 'chapter-overview-plans', seed: 'overview', label: 'Overview of Plans' },
    { id: 'chapter-eligibility', seed: 'eligibility', label: 'Eligibility' },
    { id: 'chapter-medical-ppo', seed: 'medical', label: 'Medical PPO' },
    { id: 'chapter-medical-hdhp', seed: 'health', label: 'Medical HDHP' },
    { id: 'chapter-medical-alt-hdhp', seed: 'hospital', label: 'Medical Alt HDHP' },
    { id: 'chapter-dental', seed: 'dental', label: 'Dental Benefits' },
    { id: 'chapter-vision', seed: 'vision', label: 'Vision Benefits' },
    { id: 'chapter-eap', seed: 'support', label: 'Employee Assistance' },
    { id: 'chapter-fsa-hsa', seed: 'savings', label: 'FSA and HSA' },
    { id: 'chapter-survivor', seed: 'protection', label: 'Survivor Benefits' },
    { id: 'chapter-supplemental', seed: 'supplement', label: 'Supplemental Health' },
    { id: 'chapter-income-protection', seed: 'income', label: 'Income Protection' },
    { id: 'chapter-financial', seed: 'finance', label: 'Financial Wellbeing' },
    { id: 'chapter-pto', seed: 'vacation', label: 'Paid Time Off' },
    { id: 'chapter-voluntary', seed: 'additional', label: 'Voluntary Benefits' },
];

function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const handler = (response) => {
            // Follow redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                const redirectUrl = response.headers.location;
                const protocol = redirectUrl.startsWith('https') ? https : http;
                protocol.get(redirectUrl, handler).on('error', reject);
                return;
            }
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        };
        https.get(url, handler).on('error', reject);
    });
}

async function uploadImages() {
    console.log('🖼️  Uploading images to Sanity...\n');

    for (const ch of chapterImages) {
        const url = `https://picsum.photos/seed/${ch.seed}/800/450`;
        console.log(`📸 Downloading image for "${ch.label}"...`);

        try {
            const buffer = await downloadImage(url);
            console.log(`   ⬆️  Uploading to Sanity (${(buffer.length / 1024).toFixed(0)} KB)...`);

            const asset = await client.assets.upload('image', buffer, {
                filename: `${ch.seed}-benefit.jpg`,
                contentType: 'image/jpeg',
            });

            await client.patch(ch.id).set({
                image: {
                    _type: 'image',
                    asset: { _type: 'reference', _ref: asset._id },
                },
            }).commit();

            console.log(`   ✅ Done: ${ch.label}`);
        } catch (err) {
            console.error(`   ❌ Failed for ${ch.label}: ${err.message}`);
        }
    }

    console.log('\n🎉 All images uploaded and linked to benefit chapters!');
    console.log('🔗 Refresh http://localhost:3000 to see them.');
}

uploadImages().catch((err) => {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
});
