import { createClient } from '@sanity/client';

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-02-12',
    useCdn: false,
    token: process.env.SANITY_API_READ_TOKEN,
});

async function checkChapters() {
    const chapters = await client.fetch(`*[_type == "benefitChapter"]{ 
    title, 
    "slug": slug.current, 
    "clientSlug": client->slug.current 
  }`);
    console.log(JSON.stringify(chapters, null, 2));
}

checkChapters().catch(err => {
    console.error(err);
    process.exit(1);
});
