import { defineType, defineField } from "sanity";

export default defineType({
  name: "benefitChangesPage",
  title: "Benefit Changes Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Hero Title",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Hero Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "alertMessage",
      title: "Alert Message",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "changes",
      title: "Benefit Changes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            // ... (type and title fields remain same)
            {
              name: "type",
              title: "Type",
              type: "string",
              options: {
                list: [
                  { title: "New", value: "new" },
                  { title: "Update", value: "update" },
                ],
              },
            },
            {
              name: "title",
              title: "Title",
              type: "string",
            },
            {
              name: "description",
              title: "Description",
              type: "array",
              of: [{ type: "block" }],
            },
          ],
        },
      ],
    }),
    defineField({
      name: "ctaTitle",
      title: "CTA Title",
      type: "string",
    }),
    defineField({
      name: "ctaDescription",
      title: "CTA Description",
      type: "text",
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
