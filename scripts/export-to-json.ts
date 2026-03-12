/**
 * Export content from Sanity CMS into local JSON files.
 *
 * Usage:
 *   npx tsx scripts/export-to-json.ts [clientSlug]
 *
 * Defaults to "rs-h" if no slug is provided.
 * Requires SANITY_WRITE_TOKEN (or SANITY_API_READ_TOKEN) in .env.local.
 */

import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "ow03d9eg";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-02-12";
const token =
  process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN;

if (!token) {
  console.error(
    "Error: SANITY_WRITE_TOKEN or SANITY_API_READ_TOKEN must be set."
  );
  process.exit(1);
}

const sanity = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const clientSlug = process.argv[2] || "rs-h";

function resolveImageUrl(img: any): string | undefined {
  if (!img?.asset?._ref) return undefined;
  const ref = img.asset._ref as string;
  const [, id, dimensions, format] = ref.split("-");
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}`;
}

async function main() {
  console.log(`Exporting content for client: ${clientSlug}`);

  const siteSettings = await sanity.fetch(
    `*[_type == "siteSettings" && client->slug.current == $slug][0]{
      clientName, shortName, clientLogo, logoText, footerAbout,
      quickLinks, quickAccess, contactInfo,
      footerContactTitle, footerContactDescription, copyrightText
    }`,
    { slug: clientSlug }
  );

  const clientDoc = await sanity.fetch(
    `*[_type == "client" && slug.current == $slug][0]{
      name, "slug": slug.current, themeColor
    }`,
    { slug: clientSlug }
  );

  const benefitsPage = await sanity.fetch(
    `*[_type == "benefitsPage" && client->slug.current == $slug][0]{
      title, description
    }`,
    { slug: clientSlug }
  );

  const benefitChapters = await sanity.fetch(
    `*[_type == "benefitChapter" && client->slug.current == $slug] | order(order asc, title asc){
      _id, title, description, "slug": slug.current, icon, image, content, tables, order
    }`,
    { slug: clientSlug }
  );

  const openEnrollment = await sanity.fetch(
    `*[_type == "openEnrollment" && client->slug.current == $slug][0]{
      title, description, startDate, endDate, enrollmentLink,
      "benefitsGuideUrl": coalesce(benefitsGuide.asset->url, benefitsGuideUrl),
      videoUrl, daysLeftLabel, periodLabel, statusTitle, statusDescription,
      checklistLabel, checklistSubtext, changesLabel, changesSubtext,
      enrollLabel, enrollSubtext
    }`,
    { slug: clientSlug }
  );

  const benefitChangesPage = await sanity.fetch(
    `*[_type == "benefitChangesPage" && client->slug.current == $slug][0]{
      title, description, alertMessage, changes, ctaTitle, ctaDescription
    }`,
    { slug: clientSlug }
  );

  const enrollmentChecklist = await sanity.fetch(
    `*[_type == "enrollmentChecklist" && client->slug.current == $slug][0]{
      title, description, items, ctaTitle, ctaDescription
    }`,
    { slug: clientSlug }
  );

  const retirementPlanning = await sanity.fetch(
    `*[_type == "retirementPlanning" && client->slug.current == $slug][0]{
      heroTitle, heroDescription, featuresTitle, sections,
      ctaButtonText, heroVideoUrl
    }`,
    { slug: clientSlug }
  );

  const documents = await sanity.fetch(
    `*[_type == "documentHub" && client->slug.current == $slug]{
      _id, title,
      "fileUrl": file.asset->url,
      "fileSize": file.asset->size,
      "fileType": file.asset->mimeType
    }`,
    { slug: clientSlug }
  );

  if (siteSettings?.clientLogo) {
    siteSettings.clientLogo = resolveImageUrl(siteSettings.clientLogo);
  }

  const chapters = (benefitChapters || []).map((ch: any) => ({
    ...ch,
    image: ch.image ? resolveImageUrl(ch.image) : undefined,
  }));

  const content = {
    client: clientDoc || { name: clientSlug, slug: clientSlug },
    siteSettings: siteSettings || {},
    benefitsPage: benefitsPage || { title: "Benefits", description: "" },
    benefitChapters: chapters,
    openEnrollment: openEnrollment || {},
    benefitChangesPage: benefitChangesPage || {},
    enrollmentChecklist: enrollmentChecklist || {},
    retirementPlanning: retirementPlanning || {},
    documents: documents || [],
  };

  const outDir = path.join(process.cwd(), "content");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${clientSlug}.published.json`);
  fs.writeFileSync(outPath, JSON.stringify(content, null, 2), "utf-8");

  console.log(`Exported to ${outPath}`);
  console.log(`  - ${chapters.length} benefit chapters`);
  console.log(`  - ${(documents || []).length} documents`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
