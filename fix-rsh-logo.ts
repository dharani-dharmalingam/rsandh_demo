
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env.local manually BEFORE importing any Supabase helpers
dotenv.config({ path: '.env.local' });

async function fixLogo() {
  // Dynamic imports to ensure env is loaded first
  const { uploadLogo, getPublicUrl } = await import('./lib/supabase/storage');
  const { saveContent, getPublishedContent } = await import('./lib/content');

  const slug = 'rs-h';
  const logoPathLocal = path.join(process.cwd(), 'content', 'uploads', 'rs-h-logo.png');
  
  if (!fs.existsSync(logoPathLocal)) {
    console.error('Local logo not found at:', logoPathLocal);
    process.exit(1);
  }

  console.log('Uploading logo to Supabase...');
  const buffer = fs.readFileSync(logoPathLocal);
  const storagePath = await uploadLogo(slug, buffer, 'image/png');
  const publicUrl = getPublicUrl(storagePath);
  
  console.log('Logo uploaded! Public URL:', publicUrl);

  console.log('Updating content JSON...');
  const content = getPublishedContent(slug);
  content.siteSettings.clientLogo = publicUrl;
  
  // Also ensure logoText and shortName are sensible
  content.siteSettings.logoText = 'RS&H Benefits';
  content.siteSettings.shortName = 'RS';

  saveContent(slug, content);
  console.log('Content updated locally. Preparing to push...');
}

fixLogo().catch(console.error);
