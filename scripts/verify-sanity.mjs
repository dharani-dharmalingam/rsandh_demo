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

const types = [
    'benefitChapter',
    'openEnrollment',
    'benefitChangesPage',
    'benefitsPage',
    'documentHub',
    'enrollmentChecklist',
    'retirementPlanning',
];

for (const t of types) {
    const docs = await c.fetch(`*[_type == "${t}"]{ _id, _type, title }`);
    console.log(`\n📦 ${t} (${docs.length} docs):`);
    docs.forEach((d) => console.log(`   - ${d.title || d._id}`));
}
