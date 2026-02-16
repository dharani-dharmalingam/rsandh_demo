import { defineType, defineField } from "sanity";

export default defineType({
  name: "benefitsPage",
  title: "Benefits Overview Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Page Description",
      type: "text",
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
