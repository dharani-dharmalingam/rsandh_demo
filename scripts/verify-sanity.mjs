import { createClient } from '@sanity/client';

const c = createClient({
    projectId: 'ow03d9eg',
    dataset: 'production',
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
