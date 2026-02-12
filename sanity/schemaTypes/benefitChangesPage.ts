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
      type: "text",
    }),
    defineField({
      name: "alertMessage",
      title: "Alert Message",
      type: "text",
    }),
    defineField({
      name: "changes",
      title: "Benefit Changes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
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
              type: "text",
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
  ],
});
