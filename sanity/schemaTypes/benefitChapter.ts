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
      title: "Plan Details Tables",
      type: "array",
      description: "Grouped plan detail tables. Each entry is a separate table with its own title and rows. Supports single-plan (inNetwork/outOfNetwork) and multi-plan comparison layouts.",
      of: [
        {
          type: "object",
          fields: [
            { name: "tableTitle", title: "Table Title", type: "string", description: "e.g., Plan Benefits Summary, Prescription Drug Coverage, Out-of-Network Coverage" },
            { name: "tableDescription", title: "Table Description", type: "text", description: "Optional description shown above the table" },
            {
              name: "planColumns",
              title: "Plan Columns (for multi-plan comparison)",
              type: "array",
              description: "Define plan columns for side-by-side comparison (e.g., Core Plan, Enhanced Plan). Leave empty for single-plan tables.",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "planName", title: "Plan Name", type: "string", description: "e.g., Core Plan, Enhanced Plan" },
                    { name: "subtitle", title: "Subtitle", type: "string", description: "e.g., formerly Preferred Plan" },
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
                    { name: "label", title: "Label", type: "string", description: "e.g., Deductible, Coinsurance, Out-of-Pocket Max" },
                    { name: "description", title: "Description", type: "text", description: "Optional sub-description shown below the label" },
                    { name: "inNetwork", title: "In-Network", type: "string", description: "In-network value (single-plan mode)" },
                    { name: "outOfNetwork", title: "Out-of-Network", type: "string", description: "Out-of-network value (single-plan mode)" },
                    { name: "frequency", title: "Frequency", type: "string", description: "Optional frequency column (e.g., Every 12 months)" },
                    { name: "isSection", title: "Section Header?", type: "boolean", description: "If true, renders as a dark section header row" },
                    { name: "spanColumns", title: "Span Columns?", type: "boolean", description: "If true, the value spans across all plan columns" },
                    {
                      name: "planValues",
                      title: "Plan Values (multi-plan mode)",
                      type: "array",
                      description: "Values for each plan column. Order must match planColumns.",
                      of: [
                        {
                          type: "object",
                          fields: [
                            { name: "inNetwork", title: "In-Network", type: "string" },
                            { name: "outOfNetwork", title: "Out-of-Network", type: "string" },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
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
      name: "dynamicTables",
      title: "Dynamic Tables (Exact PDF Layout)",
      type: "array",
      description: "Tables extracted with exact column structure from the PDF. Used for non-overview chapters (Dental, Vision, FSA, HSA, etc.).",
      of: [
        {
          type: "object",
          fields: [
            { name: "tableTitle", title: "Table Title", type: "string" },
            { name: "tableDescription", title: "Table Description", type: "text" },
            {
              name: "headers",
              title: "Column Headers",
              type: "array",
              description: "Column headers exactly as they appear in the PDF table.",
              of: [{ type: "string" }],
            },
            {
              name: "rows",
              title: "Table Rows",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    {
                      name: "cells",
                      title: "Cell Values",
                      type: "array",
                      description: "Cell values in the same order as headers.",
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
