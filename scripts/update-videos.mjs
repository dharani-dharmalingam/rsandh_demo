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

async function updateVideos() {
    console.log('🎬 Updating Video URLs...');

    try {
        // Update Open Enrollment Video
        const enrollment = await client.fetch('*[_type == "openEnrollment"][0]');
        if (enrollment) {
            await client.patch(enrollment._id).set({
                videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
            }).commit();
            console.log('✅ Open Enrollment video updated.');
        }

        // Update Retirement Planning Video
        const retirement = await client.fetch('*[_type == "retirementPlanning"][0]');
        if (retirement) {
            await client.patch(retirement._id).set({
                heroVideoUrl: 'https://www.youtube.com/watch?v=2f_e_3I9XN8'
            }).commit();
            console.log('✅ Retirement Planning video updated.');
        }

        console.log('🎉 All videos updated!');
    } catch (error) {
        console.error('❌ Error updating videos:', error.message);
    }
}

updateVideos();
