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
        // 1. Fetch EVERYTHING (small dataset, safer to filter in JS)
        console.log('📂 Fetching all documents to find hidden references...');
        const allDocs = await client.fetch(`*`);

        // 2. Find target client docs (published and draft)
        const clientDocs = allDocs.filter(d =>
            d._type === 'client' &&
            (d.slug?.current === slug || (d._id.startsWith('drafts.') && allDocs.find(p => p._id === d._id.replace('drafts.', '') && p.slug?.current === slug)))
        );

        if (clientDocs.length === 0) {
            console.error(`❌ No client found with slug "${slug}".`);
            return;
        }

        // Get all possible IDs for this client (base and drafts)
        const clientIds = new Set();
        clientDocs.forEach(d => {
            const baseId = d._id.replace('drafts.', '');
            clientIds.add(baseId);
            clientIds.add(`drafts.${baseId}`);
        });

        console.log(`✅ Found client with base IDs: ${Array.from(clientIds).join(', ')}`);

        // 3. Find ALL documents referencing ANY of these IDs, or containing the slug suffix
        console.log('🔍 Identifying all related documents and drafts...');
        const toDeleteIds = new Set(clientIds);

        function hasReference(obj, targetIds) {
            if (!obj) return false;
            if (typeof obj === 'string') return targetIds.has(obj);
            if (Array.isArray(obj)) return obj.some(item => hasReference(item, targetIds));
            if (typeof obj === 'object') {
                // Check if it's a reference object
                if (obj._ref && targetIds.has(obj._ref)) return true;
                return Object.values(obj).some(val => hasReference(val, targetIds));
            }
            return false;
        }

        allDocs.forEach(doc => {
            // Skip the client docs themselves (already in set)
            if (toDeleteIds.has(doc._id)) return;

            // Check if it references the client
            if (hasReference(doc, clientIds)) {
                toDeleteIds.add(doc._id);
                // Also add its draft if it exists
                const baseId = doc._id.replace('drafts.', '');
                toDeleteIds.add(baseId);
                toDeleteIds.add(`drafts.${baseId}`);
            }

            // Heuristic cleanup: if the ID contains the slug-based suffix (like -pram)
            // This is just a safeguard for documents that might link via other means
            const shortSlug = slug.substring(0, 4); // common suffix pattern
            if (doc._id.includes(`-${shortSlug}`) || doc._id.includes(slug)) {
                toDeleteIds.add(doc._id);
            }
        });

        console.log(`📦 Found ${toDeleteIds.size} unique document IDs to remove (including potential drafts).`);

        // 4. Executing atomic deletion
        console.log('🗑️  Executing atomic deletion...');
        const tx = client.transaction();

        // Sort to ensure we handle things predictably? Not strictly necessary for transaction
        const finalIds = Array.from(toDeleteIds);
        finalIds.forEach(id => {
            console.log(`  - Deleting: ${id}`);
            tx.delete(id);
        });

        const result = await tx.commit();

        console.log('\n✨ Client and all associated data deleted successfully!');
        console.log(`✅ ${finalIds.length} documents/drafts removed.`);

    } catch (error) {
        console.error('❌ Error during deletion:', error.message);
    }
}

const slugToDelete = process.argv[2];
deleteClient(slugToDelete);
