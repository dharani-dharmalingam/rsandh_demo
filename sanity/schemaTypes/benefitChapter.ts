import { defineType, defineField } from "sanity";

export default defineType({
  name: "benefitChapter",
  title: "Benefit Chapter",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Short Description",
      type: "text",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icon Name (optional)",
      type: "string",
      description: "Example: heart, shield, dollar-sign",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "content",
      title: "Full Content",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "planDetails",
      title: "Plan Details (Table)",
      type: "array",
      description: "Structured plan details displayed as a comparison table (e.g., Deductible, Co-pay, etc.)",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Label", type: "string", description: "e.g., Deductible, Coinsurance, Out-of-Pocket Max" },
            { name: "description", title: "Description", type: "text", description: "Optional sub-description shown below the label" },
            { name: "inNetwork", title: "In-Network", type: "string", description: "In-network value" },
            { name: "outOfNetwork", title: "Out-of-Network", type: "string", description: "Out-of-network value (leave blank if N/A)" },
            { name: "frequency", title: "Frequency", type: "string", description: "Optional frequency column (e.g., Every 12 months)" },
            { name: "isSection", title: "Section Header?", type: "boolean", description: "If true, renders as a dark section header row" },
            { name: "spanColumns", title: "Span Columns?", type: "boolean", description: "If true, the in-network value spans across both value columns" },
          ],
        },
      ],
    }),
    defineField({
      name: "premiumTables",
      title: "Premium Contribution Tables",
      type: "array",
      description: "Premium contribution tables showing bi-weekly costs by coverage tier (e.g., Medical, Dental, Vision)",
      of: [
        {
          type: "object",
          fields: [
            { name: "planName", title: "Plan Name", type: "string", description: "e.g., HDHP, Anthem Blue Cross - PPO" },
            { name: "sectionTitle", title: "Section Title", type: "string", description: "e.g., Medical Premiums, Dental Plan Summary" },
            { name: "sectionDescription", title: "Section Description", type: "text", description: "Description text displayed above the table" },
            {
              name: "tiers",
              title: "Coverage Tiers",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "tierName", title: "Tier Name", type: "string", description: "e.g., Team Member Only, Team Member + Family" },
                    { name: "amount", title: "Amount", type: "string", description: "e.g., $91.19" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "reference",
      to: [{ type: "client" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});
