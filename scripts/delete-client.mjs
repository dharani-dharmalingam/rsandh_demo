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
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-02-11',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
});

async function deleteClient(slug) {
    if (!slug) {
        console.error('❌ Please provide a client slug. Example: node scripts/delete-client.mjs premier-america');
        process.exit(1);
    }

    console.log(`🔍 Searching for client with slug: "${slug}"...`);

    try {
        // 1. Find the client document
        const clientDoc = await client.fetch(`*[_type == "client" && slug.current == $slug][0]`, { slug });

        if (!clientDoc) {
            console.error(`❌ No client found with slug "${slug}".`);
            return;
        }

        const clientId = clientDoc._id;
        console.log(`✅ Found client: ${clientDoc.name} (${clientId})`);

        // 2. Find all documents referencing this client (including drafts)
        console.log('📂 Finding all related documents and drafts...');
        const relatedDocs = await client.fetch(
            `*[references($clientId) || _id in ["drafts." + $clientId] || _id match "drafts.**" && references($clientId)]`,
            { clientId }
        );

        console.log(`📦 Found ${relatedDocs.length} documents to remove.`);

        if (relatedDocs.length === 0) {
            console.log('⚠️ No related documents found. Attempting to delete the client document only...');
        }

        // 3. Delete in a transaction
        console.log('🗑️  Executing atomic deletion...');
        const tx = client.transaction();

        // Delete all related documents
        relatedDocs.forEach(doc => {
            console.log(`  - Deleting ${doc._type}: ${doc._id}`);
            tx.delete(doc._id);
        });

        // Finally delete the client itself
        tx.delete(clientId);
        // Also try to delete its draft just in case
        tx.delete(`drafts.${clientId}`);

        const result = await tx.commit();

        console.log('\n✨ Client and all associated data deleted successfully!');
        console.log(`✅ ${relatedDocs.length} sub-documents removed.`);
        console.log(`✅ Client document "${clientDoc.name}" removed.`);

    } catch (error) {
        console.error('❌ Error during deletion:', error.message);
    }
}

const slugToDelete = process.argv[2];
deleteClient(slugToDelete);
