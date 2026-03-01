/**
 * Quick fix: Remove duplicate plan columns from Overview, Dental, and Vision chapters.
 * Removes columns that have all "—" values (the duplicate/alias columns).
 */
import { createClient } from '@sanity/client';
import fs from 'fs';

// Load .env.local
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

async function fixDuplicateColumns() {
    console.log('🔧 Fixing duplicate columns in Overview, Dental, and Vision chapters...\n');

    // Find all benefit chapters that have tables
    const chapters = await client.fetch(`
        *[_type == "benefitChapter" && defined(tables)] {
            _id,
            title,
            tables
        }
    `);

    let updated = 0;

    for (const ch of chapters) {
        const titleLower = ch.title.toLowerCase();

        // Only process Overview, Dental, and Vision
        const isTarget = titleLower.includes('overview') ||
            titleLower.includes('dental') ||
            titleLower.includes('vision');
        if (!isTarget) continue;

        let changed = false;
        const fixedTables = (ch.tables || []).map(table => {
            const columns = table.columns || [];
            const rows = table.rows || [];

            if (columns.length <= 2) return table; // Nothing to fix

            // Find columns where ALL non-section rows have "—" values
            const emptyColIndices = [];
            for (let cIdx = 0; cIdx < columns.length; cIdx++) {
                const allEmpty = rows
                    .filter(r => !r.isSection)
                    .every(r => {
                        const cell = (r.cells || [])[cIdx];
                        return !cell || cell === '—' || cell === '---' || cell === '-';
                    });
                if (allEmpty) {
                    emptyColIndices.push(cIdx);
                }
            }

            if (emptyColIndices.length === 0) return table;

            // Also clean up column labels: strip parentheticals
            const keptColumns = columns
                .filter((_, i) => !emptyColIndices.includes(i))
                .map((col, i) => ({
                    ...col,
                    _key: `col-${i}`,
                    label: col.label.replace(/\s*\(formerly.*?\)\s*/gi, '').trim(),
                }));

            const keptRows = rows.map((row, rIdx) => {
                if (row.isSection || !row.cells) return row;
                const keptCells = (row.cells || []).filter((_, i) => !emptyColIndices.includes(i));
                return { ...row, cells: keptCells };
            });

            console.log(`  📊 ${ch.title} / "${table.tableTitle}": Removing ${emptyColIndices.length} empty columns (${emptyColIndices.map(i => columns[i].label).join(', ')})`);
            changed = true;

            return {
                ...table,
                columns: keptColumns,
                rows: keptRows,
            };
        });

        if (changed) {
            await client.patch(ch._id).set({ tables: fixedTables }).commit();
            console.log(`  ✅ Updated: ${ch.title}\n`);
            updated++;
        }
    }

    if (updated === 0) {
        console.log('No duplicate columns found — data looks clean!');
    } else {
        console.log(`\n✅ Fixed ${updated} chapter(s). Refresh your browser to see the changes.`);
    }
}

fixDuplicateColumns().catch(err => {
    console.error('❌ Error:', err.message);
});
