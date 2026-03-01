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
      name: "tables",
      title: "Benefit Tables",
      type: "array",
      description: "Unified table format for all benefit data — supports both templated (Medical, Dental, Vision) and dynamic (FSA, HSA, Disability, etc.) tables.",
      of: [
        {
          type: "object",
          fields: [
            { name: "tableTitle", title: "Table Title", type: "string", description: "e.g., Premium Rates, Plan Benefits Summary, Dental" },
            { name: "tableDescription", title: "Table Description", type: "text", description: "Optional description shown above the table" },
            { name: "templateId", title: "Template ID", type: "string", description: "Links to global template (e.g., medical-premiums, dental-benefits). Empty for dynamic tables." },
            {
              name: "columns",
              title: "Columns",
              type: "array",
              description: "Column definitions. For multi-plan tables, each plan may have In-Network and Out-of-Network sub-columns.",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "key", title: "Key", type: "string", description: "Unique column identifier, e.g., ppo-in-network" },
                    { name: "label", title: "Label", type: "string", description: "Column header text, e.g., PPO, Core Plan" },
                    { name: "subLabel", title: "Sub-Label", type: "string", description: "Optional sub-header, e.g., In-network, Out-of-network" },
                  ],
                },
              ],
            },
            {
              name: "rows",
              title: "Table Rows",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "label", title: "Label", type: "string", description: "Row label, e.g., Deductible, Annual Maximum" },
                    {
                      name: "cells",
                      title: "Cell Values",
                      type: "array",
                      description: "Values in the same order as columns. Use — for empty cells.",
                      of: [{ type: "string" }],
                    },
                    { name: "isSection", title: "Section Header?", type: "boolean", description: "If true, renders as a dark section header row" },
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
      weak: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
});
