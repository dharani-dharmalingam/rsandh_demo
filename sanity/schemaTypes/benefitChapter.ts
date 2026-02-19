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
            { name: "inNetwork", title: "In-Network", type: "string", description: "In-network value" },
            { name: "outOfNetwork", title: "Out-of-Network", type: "string", description: "Out-of-network value (leave blank if N/A)" },
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
