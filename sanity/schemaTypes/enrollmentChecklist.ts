import { defineType, defineField } from "sanity";

export default defineType({
    name: "enrollmentChecklist",
    title: "Enrollment Checklist Page",
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
            name: "items",
            title: "Checklist Items",
            type: "array",
            of: [
                {
                    type: "object",
                    fields: [
                        { name: "step", title: "Step Number", type: "number" },
                        { name: "title", title: "Title", type: "string" },
                        { name: "description", title: "Description", type: "text" },
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
            validation: (Rule) => Rule.required(),
        }),
    ],
});
