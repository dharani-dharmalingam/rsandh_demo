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

const c = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ow03d9eg',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-02-11',
    useCdn: false,
});

const docs = await c.fetch('*[_type == "benefitChapter"]{ title, "hasImage": defined(image.asset) } | order(title asc)');
console.log(`\nBenefit Chapters: ${docs.length} total\n`);
let withImage = 0;
docs.forEach(d => {
    const mark = d.hasImage ? '✅' : '❌';
    if (d.hasImage) withImage++;
    console.log(`  ${mark} ${d.title}`);
});
console.log(`\n${withImage}/${docs.length} chapters have images`);
