
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    });

    const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
    const token = env.SANITY_WRITE_TOKEN || env.SANITY_API_TOKEN;

    console.log('--- Sanity Connection Test ---');
    console.log(`Project ID: ${projectId}`);
    console.log(`Dataset: ${dataset}`);
    console.log(`Token Present: ${!!token}`);

    const fileAssetId = 'file-9a6a7807027e9538e2495828db32f5b32671f7bd-pdf';

    async function test() {
        try {
            console.log(`\n1. Fetching document metadata: ${fileAssetId}...`);
            const url = `https://${projectId}.api.sanity.io/v2023-10-01/data/doc/${dataset}/${fileAssetId}`;
            console.log(`URL: ${url}`);

            const start = Date.now();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Metadata fetch status: ${res.status} (${Date.now() - start}ms)`);

            if (!res.ok) {
                const text = await res.text();
                console.error('Metadata fetch failed:', text);
                return;
            }

            const data = await res.json();
            const doc = data.documents && data.documents[0];
            if (!doc || !doc.url) {
                console.error('No document URL found in metadata.');
                return;
            }

            console.log(`\n2. Downloading PDF file: ${doc.url}...`);
            const dlStart = Date.now();
            const fileRes = await fetch(doc.url);
            console.log(`PDF download start status: ${fileRes.status}`);

            if (!fileRes.ok) {
                console.error('PDF download failed:', fileRes.status);
                return;
            }

            const buffer = await fileRes.arrayBuffer();
            const duration = Date.now() - dlStart;
            console.log(`\nSUCCESS!`);
            console.log(`Size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Time: ${duration}ms`);
            console.log(`Speed: ${((buffer.byteLength / 1024 / 1024) / (duration / 1000)).toFixed(2)} MB/s`);

        } catch (err) {
            console.error('\nERROR during test:');
            console.error(err);
        }
    }

    test();

} catch (err) {
    console.error('Setup failed:');
    console.error(err);
}
