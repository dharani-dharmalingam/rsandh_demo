import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'openEnrollment',
  title: 'Open Enrollment Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'datetime' }),
    defineField({ name: 'endDate', title: 'End Date', type: 'datetime' }),
    defineField({ name: 'enrollmentLink', title: 'Enrollment Link', type: 'url' }),
    defineField({ name: 'benefitsGuide', title: 'Benefits Guide PDF (Upload)', type: 'file', description: 'Upload a PDF file, or use the URL field below instead' }),
    defineField({ name: 'benefitsGuideUrl', title: 'Benefits Guide URL (Link)', type: 'url', description: 'Paste a direct link to the benefits guide. Used if no PDF is uploaded above.' }),
    defineField({ name: 'videoUrl', title: 'Hero Video URL', type: 'url', description: 'Enter a YouTube or Vimeo embed link' }),
    defineField({ name: 'daysLeftLabel', title: 'Days Left Card Label', type: 'string', description: 'Default: Days Left', placeholder: 'Days Left' }),
    defineField({ name: 'periodLabel', title: 'Enrollment Period Card Label', type: 'string', description: 'Default: Open Enrollment Period', placeholder: 'Open Enrollment Period' }),
    defineField({ name: 'statusTitle', title: 'Status Card Title', type: 'string', description: 'Default: Action Needed', placeholder: 'Action Needed' }),
    defineField({ name: 'statusDescription', title: 'Status Card Description', type: 'string', description: 'Default: Review and update your selections now', placeholder: 'Review and update your selections now' }),
    defineField({ name: 'checklistLabel', title: 'Checklist Button Label', type: 'string', description: 'Default: Review Enrollment Checklist', placeholder: 'Review Enrollment Checklist' }),
    defineField({ name: 'checklistSubtext', title: 'Checklist Button Subtext', type: 'string', description: 'Default: Prepare for open enrollment', placeholder: 'Prepare for open enrollment' }),
    defineField({ name: 'changesLabel', title: 'Changes Button Label', type: 'string', description: 'Default: Discover Benefit Changes', placeholder: 'Discover Benefit Changes' }),
    defineField({ name: 'changesSubtext', title: 'Changes Button Subtext', type: 'string', description: 'Default: What\'s new for 2026', placeholder: 'What\'s new for 2026' }),
    defineField({ name: 'enrollLabel', title: 'Enroll Button Label', type: 'string', description: 'Default: Enroll Now', placeholder: 'Enroll Now' }),
    defineField({ name: 'enrollSubtext', title: 'Enroll Button Subtext', type: 'string', description: 'Default: Complete your enrollment', placeholder: 'Complete your enrollment' }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
      validation: (Rule) => Rule.required(),
    }),
  ]
})
