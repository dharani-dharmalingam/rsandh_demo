export const chaptersQuery = `
*[_type == "benefitChapter" && client->slug.current == $clientSlug] | order(order asc){
  _id,
  title,
  description,
  "slug": slug.current,
  icon,
  image
}
`;

export const chapterBySlugQuery = `
*[_type == "benefitChapter" && slug.current == $slug && client->slug.current == $clientSlug][0]{
  _id,
  title,
  description,
  "slug": slug.current,
  image,
  content,
  tables
}
`;

export const benefitChangesQuery = `
*[_type == "benefitChangesPage" && client->slug.current == $clientSlug][0]{
  title,
  description,
  alertMessage,
  changes,
  ctaTitle,
  ctaDescription
}
`;

export const benefitsPageQuery = `
*[_type == "benefitsPage" && client->slug.current == $clientSlug][0]{
  title,
  description
}
`;

export const benefitChaptersQuery = `
*[_type == "benefitChapter" && client->slug.current == $clientSlug] | order(order asc, title asc){
  _id,
  title,
  description,
  "slug": slug.current,
  icon,
  image
}
`;

export const openEnrollmentQuery = `
*[_type == "openEnrollment" && client->slug.current == $clientSlug][0]{
  title,
  description,
  startDate,
  endDate,
  enrollmentLink,
  "benefitsGuideUrl": coalesce(benefitsGuide.asset->url, benefitsGuideUrl),
  videoUrl,
  daysLeftLabel,
  periodLabel,
  statusTitle,
  statusDescription,
  checklistLabel,
  checklistSubtext,
  changesLabel,
  changesSubtext,
  enrollLabel,
  enrollSubtext
}
`;

export const documentsQuery = `
*[_type == "documentHub" && client->slug.current == $clientSlug]{
  _id,
  title,
  "fileUrl": file.asset->url,
  "fileSize": file.asset->size,
  "fileType": file.asset->mimeType
}
`;

export const enrollmentChecklistQuery = `
*[_type == "enrollmentChecklist" && client->slug.current == $clientSlug][0]{
  title,
  description,
  items,
  ctaTitle,
  ctaDescription
}
`;

export const retirementPlanningQuery = `
*[_type == "retirementPlanning" && client->slug.current == $clientSlug][0]{
  heroTitle,
  heroDescription,
  featuresTitle,
  features,
  planningTitle,
  sections,
  ctaButtonText,
  heroVideoUrl
}
`;

export const siteSettingsQuery = `
*[_type == "siteSettings" && client->slug.current == $clientSlug][0]{
  clientName,
  shortName,
  clientLogo,
  logoText,
  footerAbout,
  quickLinks,
  quickAccess,
  contactInfo,
  footerContactTitle,
  footerContactDescription,
  copyrightText
}
`;


export const allClientsQuery = `
*[_type == "client"] | order(name asc){
  _id,
  name,
  "slug": slug.current,
  themeColor,
  "description": *[_type == "siteSettings" && client._ref == ^._id][0].footerAbout
}
`;
