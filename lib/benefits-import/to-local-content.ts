/**
 * Convert a SanitySeedPayload (from the extraction pipeline) into the local
 * EmployerContent format used by the file-based CMS.
 */

import type { SanitySeedPayload } from '../seedClient'
import type { EmployerContent } from '../content/types'

/* The seed payload types sometimes use `string` for fields that are actually
   Portable Text arrays at runtime. We cast through `any` where needed. */

export function seedPayloadToLocalContent(
  payload: SanitySeedPayload,
  existingContent?: Partial<EmployerContent>
): EmployerContent {
  const client = payload.client
  const slug = client.slug?.current ?? client.name?.toLowerCase().replace(/\s+/g, '-') ?? 'unknown'

  return {
    client: {
      name: client.name ?? slug,
      slug,
      themeColor: client.themeColor,
    },
    siteSettings: {
      clientName: payload.siteSettings.clientName,
      shortName: payload.siteSettings.shortName,
      logoText: payload.siteSettings.logoText,
      footerAbout: payload.siteSettings.footerAbout,
      quickAccess: (payload.siteSettings.quickAccess ?? []).map((q: any) => ({
        title: q.title,
        description: q.description,
        href: q.href,
        iconName: q.iconName,
      })),
      contactInfo: (payload.siteSettings.contactInfo ?? []).map((c: any) => ({
        label: c.label,
        value: c.value,
        href: c.href,
      })),
      quickLinks: (payload.siteSettings.quickLinks ?? []).map((l: any) => ({
        label: l.label,
        href: l.href,
      })),
      footerContactTitle: payload.siteSettings.footerContactTitle,
      footerContactDescription: payload.siteSettings.footerContactDescription,
      copyrightText: payload.siteSettings.copyrightText,
      ...(existingContent?.siteSettings?.clientLogo ? { clientLogo: existingContent.siteSettings.clientLogo } : {}),
    },
    benefitsPage: {
      title: payload.benefitsPage.title,
      description: payload.benefitsPage.description,
    },
    benefitChapters: payload.benefitChapters.map((ch) => ({
      _id: ch._id,
      title: ch.title,
      description: ch.description,
      slug: ch.slug?.current ?? ch.title.toLowerCase().replace(/\s+/g, '-'),
      icon: ch.icon,
      content: ch.content,
      tables: ch.tables?.map((t: any) => ({
        _key: t._key,
        tableTitle: t.tableTitle,
        tableDescription: t.tableDescription,
        templateId: t.templateId,
        columns: t.columns,
        rows: t.rows,
      })),
      order: ch.order,
    })),
    openEnrollment: {
      title: payload.openEnrollment.title,
      description: payload.openEnrollment.description,
      daysLeftLabel: payload.openEnrollment.daysLeftLabel,
      periodLabel: payload.openEnrollment.periodLabel,
      statusTitle: payload.openEnrollment.statusTitle,
      statusDescription: payload.openEnrollment.statusDescription,
      checklistLabel: payload.openEnrollment.checklistLabel,
      checklistSubtext: payload.openEnrollment.checklistSubtext,
      changesLabel: payload.openEnrollment.changesLabel,
      changesSubtext: payload.openEnrollment.changesSubtext,
      enrollLabel: payload.openEnrollment.enrollLabel,
      enrollSubtext: payload.openEnrollment.enrollSubtext,
    },
    benefitChangesPage: {
      title: payload.benefitChangesPage.title,
      description: payload.benefitChangesPage.description as any,
      alertMessage: payload.benefitChangesPage.alertMessage as any,
      changes: (payload.benefitChangesPage.changes ?? []).map((c: any) => ({
        _key: c._key,
        type: c.type,
        title: c.title,
        description: c.description,
      })),
      ctaTitle: payload.benefitChangesPage.ctaTitle,
      ctaDescription: payload.benefitChangesPage.ctaDescription,
    },
    enrollmentChecklist: {
      title: payload.enrollmentChecklist.title,
      description: payload.enrollmentChecklist.description as any,
      items: (payload.enrollmentChecklist.items ?? []).map((item: any) => ({
        _key: item._key,
        step: item.step,
        title: item.title,
        description: item.description,
      })),
      ctaTitle: payload.enrollmentChecklist.ctaTitle,
      ctaDescription: payload.enrollmentChecklist.ctaDescription,
    },
    retirementPlanning: payload.retirementPlanning ? {
      heroTitle: payload.retirementPlanning.heroTitle,
      heroDescription: payload.retirementPlanning.heroDescription as any,
      featuresTitle: payload.retirementPlanning.featuresTitle,
      sections: (payload.retirementPlanning.sections ?? []).map((s: any) => ({
        _key: s._key,
        title: s.title,
        content: s.content,
      })),
      ctaButtonText: payload.retirementPlanning.ctaButtonText,
      heroVideoUrl: payload.retirementPlanning.heroVideoUrl,
    } : {
      heroTitle: 'Plan for Your Future',
    },
    documents: [],
  }
}
